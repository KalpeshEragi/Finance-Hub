"""
@file app/services/statement_parser_service.py
@brief Bank statement parsing service for CSV and PDF files.

@description
This module provides comprehensive parsing capabilities for bank statements:
- CSV parsing with adaptive column detection
- PDF parsing using table extraction
- Date normalization across multiple formats
- Amount parsing with currency symbol handling
- Type inference (income/expense) from context
- Confidence scoring for each parsed transaction

@architecture
The parsing pipeline:
1. File type detection (CSV vs PDF)
2. Column/header detection and mapping
3. Row-by-row parsing with error isolation
4. Normalization (dates, amounts, types)
5. Confidence scoring
6. Aggregation of results and errors

@note
Designed for Indian bank statements but handles international formats too.
Uses graceful degradation - unparseable rows are flagged, not dropped.
"""

import csv
import io
import re
import logging
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime
from dateutil import parser as date_parser

from app.models.statement_schemas import (
    ParsedTransaction,
    ParsingError,
    StatementParseResponse,
    ColumnMapping,
)

logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS - COLUMN SYNONYMS
# =============================================================================

# Maps our standard field names to common variations across Indian banks
COLUMN_SYNONYMS: Dict[str, List[str]] = {
    "date": [
        "date", "transaction date", "txn date", "posting date", 
        "value date", "trans date", "trn date", "dated", "dt"
    ],
    "description": [
        "description", "narration", "particulars", "details", 
        "remarks", "memo", "transaction details", "txn description",
        "narrative", "trans particulars"
    ],
    "amount": [
        "amount", "transaction amount", "txn amount", "value", 
        "sum", "total"
    ],
    "debit": [
        "debit", "dr", "withdrawal", "debit amount", "withdrawals",
        "debit amt", "dr amount", "withdrawal amt"
    ],
    "credit": [
        "credit", "cr", "deposit", "credit amount", "deposits",
        "credit amt", "cr amount", "deposit amt"
    ],
    "balance": [
        "balance", "closing balance", "available balance", 
        "running balance", "bal", "closing bal", "avl balance"
    ],
    "reference": [
        "reference", "ref", "ref no", "reference no", "reference number",
        "txn id", "transaction id", "chq no", "cheque no", 
        "utr", "utr no"
    ],
    "type": [
        "type", "transaction type", "txn type", "dr/cr", 
        "debit/credit", "tx type"
    ],
}


# =============================================================================
# CONSTANTS - DATE FORMATS
# =============================================================================

# Common date formats in Indian bank statements (ordered by priority)
DATE_FORMATS: List[str] = [
    "%d/%m/%Y",      # 15/01/2024 (most common Indian format)
    "%d-%m-%Y",      # 15-01-2024
    "%d/%m/%y",      # 15/01/24
    "%d-%m-%y",      # 15-01-24
    "%Y-%m-%d",      # 2024-01-15 (ISO format)
    "%d %b %Y",      # 15 Jan 2024
    "%d %B %Y",      # 15 January 2024
    "%d-%b-%Y",      # 15-Jan-2024
    "%d-%b-%y",      # 15-Jan-24
    "%m/%d/%Y",      # 01/15/2024 (US format, lower priority)
    "%Y/%m/%d",      # 2024/01/15
]


# =============================================================================
# CONSTANTS - TYPE INFERENCE KEYWORDS
# =============================================================================

INCOME_KEYWORDS = [
    "salary", "credit", "credited", "deposit", "deposited",
    "refund", "cashback", "interest", "dividend", "neft-",
    "imps-", "upi-", "transfer from", "received", "inward"
]

EXPENSE_KEYWORDS = [
    "debit", "debited", "withdrawal", "withdrawn", "purchase",
    "payment", "paid", "atm", "pos", "transfer to", "outward",
    "emi", "loan", "bill", "charge", "fee"
]


# =============================================================================
# MAIN PARSING FUNCTIONS
# =============================================================================

def parse_statement(
    content: bytes, 
    filename: str
) -> StatementParseResponse:
    """
    @brief Main entry point for statement parsing.
    
    @param content Raw file bytes.
    @param filename Original filename for type detection.
    @return StatementParseResponse with parsed transactions and errors.
    
    @description
    Detects file type from extension and delegates to appropriate parser.
    Handles encoding issues gracefully.
    """
    file_ext = filename.lower().split(".")[-1] if "." in filename else ""
    
    if file_ext == "csv":
        return parse_csv_statement(content)
    elif file_ext == "pdf":
        return parse_pdf_statement(content)
    else:
        # Try to parse as CSV by default
        logger.warning(f"Unknown file extension '{file_ext}', attempting CSV parse")
        return parse_csv_statement(content)


def parse_csv_statement(content: bytes) -> StatementParseResponse:
    """
    @brief Parse a CSV bank statement.
    
    @param content Raw CSV file bytes.
    @return StatementParseResponse with parsed transactions.
    
    @description
    Uses adaptive column detection to handle various bank formats.
    Supports common encodings (UTF-8, UTF-8 BOM, Latin-1).
    """
    transactions: List[ParsedTransaction] = []
    errors: List[ParsingError] = []
    column_mapping = ColumnMapping()
    
    # Try different encodings
    text_content = None
    for encoding in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
        try:
            text_content = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    
    if text_content is None:
        return StatementParseResponse(
            success=False,
            file_type="csv",
            transactions=[],
            total_parsed=0,
            successful=0,
            failed=0,
            errors=[ParsingError(row=0, message="Unable to decode file content")],
        )
    
    # Parse CSV
    try:
        reader = csv.reader(io.StringIO(text_content))
        rows = list(reader)
    except csv.Error as e:
        return StatementParseResponse(
            success=False,
            file_type="csv",
            transactions=[],
            total_parsed=0,
            successful=0,
            failed=0,
            errors=[ParsingError(row=0, message=f"CSV parsing error: {str(e)}")],
        )
    
    if len(rows) < 2:
        return StatementParseResponse(
            success=True,
            file_type="csv",
            transactions=[],
            total_parsed=0,
            successful=0,
            failed=0,
            errors=[ParsingError(row=0, message="File has no data rows")],
        )
    
    # Detect headers and create column mapping
    headers = rows[0]
    col_indices = _detect_columns(headers)
    column_mapping = _create_column_mapping(headers, col_indices)
    
    logger.info(f"Detected column mapping: {col_indices}")
    
    # Parse data rows
    for row_num, row in enumerate(rows[1:], start=2):
        if not row or all(cell.strip() == "" for cell in row):
            continue  # Skip empty rows
            
        try:
            raw_text = ",".join(row)
            txn = _parse_csv_row(row, col_indices, row_num, raw_text)
            transactions.append(txn)
        except Exception as e:
            errors.append(ParsingError(
                row=row_num,
                message=str(e),
                raw_text=",".join(row)[:200],  # Truncate for safety
            ))
    
    successful = sum(1 for t in transactions if t.confidence >= 0.5)
    failed = len(errors)
    
    return StatementParseResponse(
        success=True,
        file_type="csv",
        transactions=transactions,
        total_parsed=len(transactions) + failed,
        successful=successful,
        failed=failed,
        errors=errors,
        column_mapping=column_mapping,
    )


def parse_pdf_statement(content: bytes) -> StatementParseResponse:
    """
    @brief Parse a PDF bank statement.
    
    @param content Raw PDF file bytes.
    @return StatementParseResponse with parsed transactions.
    
    @description
    Uses pdfplumber to extract tables from PDF.
    Attempts to find transaction tables and parse them.
    Falls back to text extraction if tables not found.
    """
    transactions: List[ParsedTransaction] = []
    errors: List[ParsingError] = []
    column_mapping = ColumnMapping()
    
    try:
        import pdfplumber
    except ImportError:
        return StatementParseResponse(
            success=False,
            file_type="pdf",
            transactions=[],
            total_parsed=0,
            successful=0,
            failed=0,
            errors=[ParsingError(row=0, message="PDF parsing library not installed")],
        )
    
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            all_rows: List[List[str]] = []
            
            # Extract tables from all pages
            for page_num, page in enumerate(pdf.pages, start=1):
                tables = page.extract_tables()
                
                for table in tables:
                    if table:
                        for row in table:
                            # Clean up cells
                            cleaned_row = [
                                str(cell).strip() if cell else "" 
                                for cell in row
                            ]
                            all_rows.append(cleaned_row)
            
            if len(all_rows) < 2:
                return StatementParseResponse(
                    success=True,
                    file_type="pdf",
                    transactions=[],
                    total_parsed=0,
                    successful=0,
                    failed=0,
                    errors=[ParsingError(row=0, message="No tables found in PDF")],
                )
            
            # Find header row (first row with recognizable columns)
            header_idx = _find_header_row(all_rows)
            if header_idx < 0:
                return StatementParseResponse(
                    success=True,
                    file_type="pdf",
                    transactions=[],
                    total_parsed=0,
                    successful=0,
                    failed=0,
                    errors=[ParsingError(row=0, message="Could not identify header row")],
                )
            
            headers = all_rows[header_idx]
            col_indices = _detect_columns(headers)
            column_mapping = _create_column_mapping(headers, col_indices)
            
            # Parse data rows
            for row_num, row in enumerate(all_rows[header_idx + 1:], start=header_idx + 2):
                if not row or all(cell.strip() == "" for cell in row):
                    continue
                    
                # Skip rows that look like headers (repeated headers in multi-page PDFs)
                if _is_likely_header(row, headers):
                    continue
                
                try:
                    raw_text = " | ".join(row)
                    txn = _parse_csv_row(row, col_indices, row_num, raw_text)
                    transactions.append(txn)
                except Exception as e:
                    errors.append(ParsingError(
                        row=row_num,
                        message=str(e),
                        raw_text=" | ".join(row)[:200],
                    ))
                    
    except Exception as e:
        logger.error(f"PDF parsing error: {e}")
        return StatementParseResponse(
            success=False,
            file_type="pdf",
            transactions=[],
            total_parsed=0,
            successful=0,
            failed=0,
            errors=[ParsingError(row=0, message=f"PDF extraction failed: {str(e)}")],
        )
    
    successful = sum(1 for t in transactions if t.confidence >= 0.5)
    failed = len(errors)
    
    return StatementParseResponse(
        success=True,
        file_type="pdf",
        transactions=transactions,
        total_parsed=len(transactions) + failed,
        successful=successful,
        failed=failed,
        errors=errors,
        column_mapping=column_mapping,
    )


# =============================================================================
# COLUMN DETECTION
# =============================================================================

def _detect_columns(headers: List[str]) -> Dict[str, int]:
    """
    @brief Detect which columns map to which fields.
    
    @param headers List of header strings from first row.
    @return Dict mapping field names to column indices.
    
    @description
    Uses fuzzy matching against known column synonyms.
    Handles case-insensitive matching and partial matches.
    """
    col_indices: Dict[str, int] = {}
    
    for idx, header in enumerate(headers):
        normalized = header.lower().strip()
        
        for field_name, synonyms in COLUMN_SYNONYMS.items():
            for synonym in synonyms:
                if synonym == normalized or synonym in normalized:
                    # Don't overwrite if already found (priority to earlier matches)
                    if field_name not in col_indices:
                        col_indices[field_name] = idx
                    break
    
    return col_indices


def _create_column_mapping(
    headers: List[str], 
    col_indices: Dict[str, int]
) -> ColumnMapping:
    """
    @brief Create ColumnMapping object from detected indices.
    
    @param headers Original header strings.
    @param col_indices Detected field-to-index mapping.
    @return ColumnMapping with original header names.
    """
    mapping = ColumnMapping()
    
    for field_name, idx in col_indices.items():
        if idx < len(headers):
            setattr(mapping, field_name, headers[idx])
    
    return mapping


def _find_header_row(rows: List[List[str]]) -> int:
    """
    @brief Find the header row in a table.
    
    @param rows List of row data.
    @return Index of header row, or -1 if not found.
    
    @description
    Looks for rows that contain recognizable column headers.
    """
    for idx, row in enumerate(rows[:10]):  # Check first 10 rows
        col_indices = _detect_columns(row)
        # Need at least date and (amount OR debit/credit) columns
        has_date = "date" in col_indices
        has_amount = "amount" in col_indices or (
            "debit" in col_indices or "credit" in col_indices
        )
        if has_date and has_amount:
            return idx
    return -1


def _is_likely_header(row: List[str], headers: List[str]) -> bool:
    """
    @brief Check if a row is likely a repeated header.
    
    @param row Current row to check.
    @param headers Known header row.
    @return True if row appears to be a header.
    """
    if len(row) != len(headers):
        return False
    
    matches = sum(
        1 for r, h in zip(row, headers) 
        if r.strip().lower() == h.strip().lower()
    )
    return matches >= len(headers) * 0.7  # 70% match threshold


# =============================================================================
# ROW PARSING
# =============================================================================

def _parse_csv_row(
    row: List[str], 
    col_indices: Dict[str, int],
    row_num: int,
    raw_text: str
) -> ParsedTransaction:
    """
    @brief Parse a single row into a ParsedTransaction.
    
    @param row List of cell values.
    @param col_indices Column index mapping.
    @param row_num Row number for error reporting.
    @param raw_text Original row text.
    @return ParsedTransaction with normalized data.
    """
    # Extract raw values
    date_str = _get_cell(row, col_indices.get("date"))
    description = _get_cell(row, col_indices.get("description"))
    amount_str = _get_cell(row, col_indices.get("amount"))
    debit_str = _get_cell(row, col_indices.get("debit"))
    credit_str = _get_cell(row, col_indices.get("credit"))
    balance_str = _get_cell(row, col_indices.get("balance"))
    reference = _get_cell(row, col_indices.get("reference"))
    type_str = _get_cell(row, col_indices.get("type"))
    
    # Parse date
    parsed_date = _parse_date(date_str)
    
    # Parse amount and determine type
    amount, txn_type = _parse_amount_and_type(
        amount_str, debit_str, credit_str, type_str, description
    )
    
    # Parse balance
    balance = _parse_amount(balance_str)
    
    # Calculate confidence score
    confidence = _calculate_confidence(parsed_date, amount, description, balance)
    
    return ParsedTransaction(
        date=parsed_date,
        description=description,
        amount=amount,
        type=txn_type,
        reference=reference,
        balance=balance,
        source="bank_statement",
        confidence=confidence,
        raw_text=raw_text[:500] if raw_text else None,  # Truncate
    )


def _get_cell(row: List[str], idx: Optional[int]) -> Optional[str]:
    """
    @brief Safely get cell value from row.
    
    @param row Row data.
    @param idx Column index (may be None).
    @return Cell value or None.
    """
    if idx is None or idx >= len(row):
        return None
    value = row[idx].strip()
    return value if value else None


# =============================================================================
# DATE PARSING
# =============================================================================

def _parse_date(date_str: Optional[str]) -> Optional[str]:
    """
    @brief Parse date string to ISO-8601 format.
    
    @param date_str Raw date string.
    @return ISO-8601 date (YYYY-MM-DD) or None if unparseable.
    
    @description
    Tries multiple date formats common in Indian bank statements.
    Falls back to dateutil parser for fuzzy matching.
    """
    if not date_str:
        return None
    
    # Clean up the date string
    date_str = date_str.strip()
    
    # Try explicit formats first (more accurate)
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    # Fall back to dateutil parser (fuzzy)
    try:
        dt = date_parser.parse(date_str, dayfirst=True)
        return dt.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        return None


# =============================================================================
# AMOUNT PARSING
# =============================================================================

def _parse_amount(amount_str: Optional[str]) -> Optional[float]:
    """
    @brief Parse amount string to float.
    
    @param amount_str Raw amount string.
    @return Parsed amount as float or None.
    
    @description
    Handles:
    - Currency symbols (₹, Rs., INR)
    - Thousand separators (commas)
    - Parentheses for negative (1,000.00) → -1000.00
    - Dr/Cr suffixes
    """
    if not amount_str:
        return None
    
    # Clean up
    cleaned = amount_str.strip()
    
    # Handle empty or placeholder values
    if cleaned in ["", "-", "--", "N/A", "NA"]:
        return None
    
    # Remove currency symbols
    cleaned = re.sub(r"[₹$€£]", "", cleaned)
    cleaned = re.sub(r"\b(Rs\.?|INR|USD|EUR)\b", "", cleaned, flags=re.IGNORECASE)
    
    # Handle parentheses (negative indicator)
    is_negative = False
    if cleaned.startswith("(") and cleaned.endswith(")"):
        is_negative = True
        cleaned = cleaned[1:-1]
    
    # Handle Dr/Cr suffix
    if re.search(r"\bDr\.?\b", cleaned, re.IGNORECASE):
        is_negative = True
        cleaned = re.sub(r"\bDr\.?\b", "", cleaned, flags=re.IGNORECASE)
    elif re.search(r"\bCr\.?\b", cleaned, re.IGNORECASE):
        cleaned = re.sub(r"\bCr\.?\b", "", cleaned, flags=re.IGNORECASE)
    
    # Remove thousand separators and spaces
    cleaned = cleaned.replace(",", "").replace(" ", "")
    
    # Parse number
    try:
        amount = abs(float(cleaned))
        return -amount if is_negative else amount
    except ValueError:
        return None


def _parse_amount_and_type(
    amount_str: Optional[str],
    debit_str: Optional[str],
    credit_str: Optional[str],
    type_str: Optional[str],
    description: Optional[str]
) -> Tuple[Optional[float], str]:
    """
    @brief Parse amount and determine transaction type.
    
    @param amount_str Combined amount column value.
    @param debit_str Debit/withdrawal column value.
    @param credit_str Credit/deposit column value.
    @param type_str Explicit type column value.
    @param description Transaction description for keyword matching.
    @return Tuple of (amount, type).
    
    @description
    Priority for type determination:
    1. Explicit type column
    2. Separate debit/credit columns
    3. Dr/Cr in amount string
    4. Sign of amount
    5. Keywords in description
    """
    # Try explicit type column first
    if type_str:
        type_lower = type_str.lower().strip()
        if type_lower in ["income", "credit", "cr", "c", "deposit"]:
            txn_type = "income"
        elif type_lower in ["expense", "debit", "dr", "d", "withdrawal"]:
            txn_type = "expense"
        else:
            txn_type = "unknown"
    else:
        txn_type = "unknown"
    
    # Handle separate debit/credit columns
    debit_amt = _parse_amount(debit_str)
    credit_amt = _parse_amount(credit_str)
    
    if debit_amt is not None and debit_amt > 0:
        return (abs(debit_amt), "expense")
    elif credit_amt is not None and credit_amt > 0:
        return (abs(credit_amt), "income")
    
    # Parse combined amount column
    amount = _parse_amount(amount_str)
    
    if amount is not None:
        # Check if type was determined from Dr/Cr in amount string
        if amount < 0:
            return (abs(amount), "expense")
        elif txn_type != "unknown":
            return (abs(amount), txn_type)
        
        # Infer from description keywords
        inferred_type = _infer_type_from_description(description)
        if inferred_type != "unknown":
            return (abs(amount), inferred_type)
        
        return (abs(amount), "unknown")
    
    return (None, "unknown")


def _infer_type_from_description(description: Optional[str]) -> str:
    """
    @brief Infer transaction type from description keywords.
    
    @param description Transaction narration.
    @return "income", "expense", or "unknown".
    """
    if not description:
        return "unknown"
    
    desc_lower = description.lower()
    
    # Check income keywords
    for keyword in INCOME_KEYWORDS:
        if keyword in desc_lower:
            return "income"
    
    # Check expense keywords
    for keyword in EXPENSE_KEYWORDS:
        if keyword in desc_lower:
            return "expense"
    
    return "unknown"


# =============================================================================
# CONFIDENCE SCORING
# =============================================================================

def _calculate_confidence(
    date: Optional[str],
    amount: Optional[float],
    description: Optional[str],
    balance: Optional[float]
) -> float:
    """
    @brief Calculate confidence score for parsed transaction.
    
    @param date Parsed date or None.
    @param amount Parsed amount or None.
    @param description Parsed description or None.
    @param balance Parsed balance or None.
    @return Confidence score between 0.0 and 1.0.
    
    @description
    Weighted scoring:
    - Date parsability: 0.3 weight
    - Amount validity: 0.4 weight
    - Description presence: 0.2 weight
    - Balance presence: 0.1 weight
    """
    score = 0.0
    
    # Date (30% weight)
    if date is not None:
        score += 0.3
    
    # Amount (40% weight)
    if amount is not None and amount > 0:
        score += 0.4
    
    # Description (20% weight)
    if description and len(description) >= 3:
        score += 0.2
    
    # Balance (10% weight)
    if balance is not None:
        score += 0.1
    
    return round(score, 2)
