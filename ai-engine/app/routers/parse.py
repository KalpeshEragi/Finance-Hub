"""
@file app/routers/parse.py
@brief Document parsing endpoints for bank statement import.

@description
This router handles file uploads for bank statement parsing.
Supports CSV and PDF formats with automatic detection.

@endpoints
- POST /parse/statement - Parse uploaded bank statement file

@architecture
The parsing flow:
1. Receive file upload via multipart/form-data
2. Detect file type from extension
3. Parse using appropriate parser (CSV or PDF)
4. Return normalized transactions with confidence scores

@note
All parsing happens in-memory. No files are stored.
Parsed transactions are ready for backend /transactions/import.
"""

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.statement_schemas import StatementParseResponse
from app.services.statement_parser_service import parse_statement

router = APIRouter()
logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS
# =============================================================================

MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {"csv", "pdf"}


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/statement", response_model=StatementParseResponse)
async def parse_bank_statement(
    file: UploadFile = File(..., description="Bank statement file (CSV or PDF)")
) -> StatementParseResponse:
    """
    @brief Parse a bank statement file and extract transactions.
    
    @param file Uploaded bank statement file (CSV or PDF).
    @return StatementParseResponse containing parsed transactions.
    
    @description
    This endpoint accepts bank statement uploads and returns normalized
    transaction data ready for backend import.
    
    Supported formats:
    - CSV: Any delimited format with recognizable headers
    - PDF: Text-based PDFs with tabular transaction data
    
    The parser handles:
    - Adaptive column detection (works with various bank formats)
    - Multiple date formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
    - Amount normalization (₹ symbols, Dr/Cr, parentheses)
    - Transaction type inference (income/expense)
    - Confidence scoring per transaction
    
    @example
    curl -X POST "http://localhost:8000/parse/statement" \\
         -F "file=@statement.csv"
    
    @response
    {
        "success": true,
        "file_type": "csv",
        "transactions": [...],
        "total_parsed": 50,
        "successful": 48,
        "failed": 2,
        "errors": [...],
        "column_mapping": {...}
    }
    
    @raises HTTPException 400 if file type not supported.
    @raises HTTPException 413 if file too large.
    @raises HTTPException 422 if file processing fails.
    """
    # Get filename and extension
    filename = file.filename or "unknown"
    file_ext = filename.lower().split(".")[-1] if "." in filename else ""
    
    logger.info(f"Received statement upload: {filename} (type: {file_ext})")
    
    # Validate file extension
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{file_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"Failed to read file: {str(e)}"
        )
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
        )
    
    # Validate not empty
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )
    
    # Parse the statement
    try:
        result = parse_statement(content, filename)
        
        logger.info(
            f"Parsing complete: {result.successful}/{result.total_parsed} successful, "
            f"{result.failed} failed"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Statement parsing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Parsing failed: {str(e)}"
        )


@router.get("/formats")
async def get_supported_formats():
    """
    @brief Get information about supported file formats.
    
    @return Dict with supported formats and tips.
    
    @description
    Returns information about what file formats are supported
    and tips for successful parsing.
    """
    return {
        "supported_formats": [
            {
                "extension": "csv",
                "mime_types": ["text/csv", "application/csv"],
                "description": "Comma-separated values file",
                "tips": [
                    "First row should contain column headers",
                    "Common headers: Date, Description, Amount, Debit, Credit, Balance",
                    "Indian date formats (DD/MM/YYYY) are supported"
                ]
            },
            {
                "extension": "pdf",
                "mime_types": ["application/pdf"],
                "description": "PDF bank statement",
                "tips": [
                    "Must be a text-based PDF (not scanned image)",
                    "Transaction data should be in tabular format",
                    "Multi-page statements are supported"
                ]
            }
        ],
        "max_file_size_mb": MAX_FILE_SIZE_MB,
        "column_synonyms": {
            "date": ["Date", "Transaction Date", "Value Date", "Posting Date"],
            "description": ["Description", "Narration", "Particulars", "Details"],
            "amount": ["Amount", "Transaction Amount", "Value"],
            "debit": ["Debit", "Withdrawal", "DR"],
            "credit": ["Credit", "Deposit", "CR"],
            "balance": ["Balance", "Closing Balance", "Available Balance"]
        }
    }
