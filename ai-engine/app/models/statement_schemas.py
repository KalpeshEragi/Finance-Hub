"""
@file app/models/statement_schemas.py
@brief Pydantic schemas for bank statement parsing.

@description
This module defines all request/response models for the document parsing
pipeline. Handles bank statement uploads (CSV/PDF) and normalized transaction
output for backend import.

@architecture
The parsing flow:
1. Frontend uploads file to /parse/statement
2. AI Engine parses and normalizes transactions
3. Response contains structured data ready for backend /transactions/import

@note
All monetary amounts are in the original currency (typically INR).
Dates are normalized to ISO-8601 format when parseable.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


# =============================================================================
# PARSING ERROR MODELS
# =============================================================================

class ParsingError(BaseModel):
    """
    @class ParsingError
    @brief Details of a parsing error for a specific row.
    
    @field row Row number (1-indexed) where error occurred.
    @field message Human-readable error description.
    @field raw_text Original row content for debugging.
    """
    row: int = Field(ge=1, description="Row number (1-indexed)")
    message: str = Field(description="Error description")
    raw_text: Optional[str] = Field(default=None, description="Original row content")


# =============================================================================
# PARSED TRANSACTION MODELS
# =============================================================================

class ParsedTransaction(BaseModel):
    """
    @class ParsedTransaction
    @brief Single transaction extracted from bank statement.
    
    @description
    Represents a normalized transaction ready for backend import.
    Fields may be null if not parseable from source document.
    
    @field date Transaction date in ISO-8601 format (YYYY-MM-DD).
    @field description Transaction narration/particulars.
    @field amount Absolute transaction amount.
    @field type Whether transaction is income or expense.
    @field reference Transaction ID/reference number if available.
    @field balance Running balance after transaction if available.
    @field source Always "bank_statement" for this parser.
    @field confidence Parsing confidence score (0.0-1.0).
    @field raw_text Original row text for audit/debugging.
    """
    date: Optional[str] = Field(
        default=None, 
        description="ISO-8601 date (YYYY-MM-DD) or null if unparseable"
    )
    description: Optional[str] = Field(
        default=None, 
        description="Transaction narration/particulars"
    )
    amount: Optional[float] = Field(
        default=None, 
        ge=0,
        description="Absolute transaction amount"
    )
    type: Literal["income", "expense", "unknown"] = Field(
        default="unknown",
        description="Transaction type: income, expense, or unknown"
    )
    reference: Optional[str] = Field(
        default=None, 
        description="Transaction ID/reference if available"
    )
    balance: Optional[float] = Field(
        default=None, 
        description="Running balance after transaction"
    )
    source: str = Field(
        default="bank_statement", 
        description="Data source identifier"
    )
    confidence: float = Field(
        ge=0.0, 
        le=1.0, 
        default=0.0,
        description="Parsing confidence score (0.0-1.0)"
    )
    raw_text: Optional[str] = Field(
        default=None, 
        description="Original row text for debugging"
    )


# =============================================================================
# COLUMN MAPPING MODELS
# =============================================================================

class ColumnMapping(BaseModel):
    """
    @class ColumnMapping
    @brief Detected column mappings from CSV/PDF headers.
    
    @description
    Shows how original column names were mapped to standard fields.
    Useful for debugging and understanding parsing decisions.
    """
    date: Optional[str] = Field(default=None, description="Original column mapped to date")
    description: Optional[str] = Field(default=None, description="Original column mapped to description")
    amount: Optional[str] = Field(default=None, description="Original column mapped to amount")
    debit: Optional[str] = Field(default=None, description="Original column mapped to debit")
    credit: Optional[str] = Field(default=None, description="Original column mapped to credit")
    reference: Optional[str] = Field(default=None, description="Original column mapped to reference")
    balance: Optional[str] = Field(default=None, description="Original column mapped to balance")
    type: Optional[str] = Field(default=None, description="Original column mapped to type")


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class StatementParseResponse(BaseModel):
    """
    @class StatementParseResponse
    @brief Response from /parse/statement endpoint.
    
    @description
    Contains all parsed transactions, errors, and metadata about
    the parsing operation.
    
    @field success Whether parsing completed (may still have row errors).
    @field file_type Detected file type (csv or pdf).
    @field transactions List of successfully parsed transactions.
    @field total_parsed Total rows attempted to parse.
    @field successful Number of successfully parsed rows.
    @field failed Number of rows that failed parsing.
    @field errors List of parsing errors with row details.
    @field column_mapping Detected column mappings (for debugging).
    """
    success: bool = Field(description="Whether parsing operation completed")
    file_type: Literal["csv", "pdf"] = Field(description="Detected file type")
    transactions: List[ParsedTransaction] = Field(
        default=[],
        description="Successfully parsed transactions"
    )
    total_parsed: int = Field(ge=0, description="Total rows attempted")
    successful: int = Field(ge=0, description="Successfully parsed rows")
    failed: int = Field(ge=0, description="Failed rows")
    errors: List[ParsingError] = Field(
        default=[],
        description="Parsing errors with row details"
    )
    column_mapping: Optional[ColumnMapping] = Field(
        default=None,
        description="Detected column mappings"
    )


# =============================================================================
# BACKEND INTEGRATION MODELS
# =============================================================================

class BackendTransaction(BaseModel):
    """
    @class BackendTransaction
    @brief Transaction format expected by backend /transactions/import.
    
    @description
    Simplified transaction structure for backend consumption.
    Strips parsing metadata (confidence, raw_text) and ensures
    required fields are present.
    """
    date: str = Field(description="ISO-8601 date")
    description: str = Field(description="Transaction description")
    amount: float = Field(gt=0, description="Transaction amount")
    type: Literal["income", "expense"] = Field(description="Transaction type")
    reference: Optional[str] = Field(default=None, description="Reference number")
    balance: Optional[float] = Field(default=None, description="Running balance")


class StatementImportPayload(BaseModel):
    """
    @class StatementImportPayload
    @brief Payload for backend /transactions/import endpoint.
    
    @field source Always "bank_statement" for parsed statements.
    @field transactions List of transactions to import.
    """
    source: Literal["bank_statement"] = Field(
        default="bank_statement",
        description="Data source identifier"
    )
    transactions: List[BackendTransaction] = Field(
        description="Transactions to import"
    )


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def to_backend_payload(parsed: List[ParsedTransaction]) -> StatementImportPayload:
    """
    @brief Convert parsed transactions to backend import format.
    
    @param parsed List of ParsedTransaction objects
    @return StatementImportPayload ready for backend API
    
    @description
    Filters out transactions with missing required fields and
    converts to backend-compatible format.
    """
    valid_transactions = []
    
    for txn in parsed:
        # Skip if missing required fields
        if not txn.date or not txn.amount or txn.type == "unknown":
            continue
            
        valid_transactions.append(BackendTransaction(
            date=txn.date,
            description=txn.description or "",
            amount=txn.amount,
            type=txn.type,  # type: ignore - already validated not "unknown"
            reference=txn.reference,
            balance=txn.balance,
        ))
    
    return StatementImportPayload(transactions=valid_transactions)
