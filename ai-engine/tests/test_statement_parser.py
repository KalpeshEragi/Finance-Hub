"""
@file tests/test_statement_parser.py
@brief Unit tests for bank statement parsing service.

@description
Tests cover:
- CSV parsing with various formats
- Date normalization
- Amount parsing with currency symbols
- Type inference (income/expense)
- Column detection
- Confidence scoring
- Error handling
"""

import pytest
from app.services.statement_parser_service import (
    parse_csv_statement,
    parse_pdf_statement,
    _parse_date,
    _parse_amount,
    _detect_columns,
    _infer_type_from_description,
    _calculate_confidence,
)


# =============================================================================
# CSV PARSING TESTS
# =============================================================================

class TestCSVParsing:
    """Tests for CSV statement parsing."""
    
    def test_basic_csv_parsing(self):
        """Test parsing a basic CSV with standard headers."""
        csv_content = b"""Date,Description,Amount,Type,Balance
15/01/2024,SALARY CREDIT,50000,Credit,150000
16/01/2024,SWIGGY ORDER,450,Debit,149550
17/01/2024,AMAZON PURCHASE,2500,Debit,147050"""
        
        result = parse_csv_statement(csv_content)
        
        assert result.success is True
        assert result.file_type == "csv"
        assert len(result.transactions) == 3
        
        # Check first transaction (income)
        txn1 = result.transactions[0]
        assert txn1.date == "2024-01-15"
        assert txn1.amount == 50000.0
        assert txn1.type == "income"
        
        # Check second transaction (expense)
        txn2 = result.transactions[1]
        assert txn2.date == "2024-01-16"
        assert txn2.amount == 450.0
        assert txn2.type == "expense"
    
    def test_indian_bank_format(self):
        """Test parsing Indian bank statement format with separate debit/credit columns."""
        csv_content = b"""Value Date,Narration,Chq./Ref.No.,Withdrawal Amt.,Deposit Amt.,Closing Balance
15/01/2024,NEFT-ABC COMPANY-SALARY,,50000.00,150000.00
16/01/2024,UPI-SWIGGY-ORDER123,UPI123456,450.00,,149550.00"""
        
        result = parse_csv_statement(csv_content)
        
        assert result.success is True
        assert len(result.transactions) == 2
        
        # Check column mapping
        assert result.column_mapping is not None
        assert result.column_mapping.date == "Value Date"
        assert result.column_mapping.description == "Narration"
        
        # Check income transaction
        txn1 = result.transactions[0]
        assert txn1.type == "income"
        assert txn1.amount == 50000.0
        
        # Check expense transaction
        txn2 = result.transactions[1]
        assert txn2.type == "expense"
        assert txn2.amount == 450.0
    
    def test_empty_csv(self):
        """Test handling of empty CSV."""
        csv_content = b""
        result = parse_csv_statement(csv_content)
        
        assert result.success is True
        assert len(result.transactions) == 0
    
    def test_csv_with_only_headers(self):
        """Test CSV with only header row."""
        csv_content = b"Date,Description,Amount,Type"
        result = parse_csv_statement(csv_content)
        
        assert result.success is True
        assert len(result.transactions) == 0


# =============================================================================
# DATE PARSING TESTS
# =============================================================================

class TestDateParsing:
    """Tests for date format normalization."""
    
    @pytest.mark.parametrize("input_date,expected", [
        ("15/01/2024", "2024-01-15"),       # DD/MM/YYYY
        ("15-01-2024", "2024-01-15"),       # DD-MM-YYYY
        ("2024-01-15", "2024-01-15"),       # ISO format
        ("15 Jan 2024", "2024-01-15"),      # DD Mon YYYY
        ("15 January 2024", "2024-01-15"),  # DD Month YYYY
        ("15-Jan-2024", "2024-01-15"),      # DD-Mon-YYYY
        ("15/01/24", "2024-01-15"),         # DD/MM/YY
    ])
    def test_date_formats(self, input_date, expected):
        """Test various date formats are parsed correctly."""
        result = _parse_date(input_date)
        assert result == expected
    
    def test_invalid_date(self):
        """Test invalid date returns None."""
        assert _parse_date("not a date") is None
        assert _parse_date("") is None
        assert _parse_date(None) is None


# =============================================================================
# AMOUNT PARSING TESTS
# =============================================================================

class TestAmountParsing:
    """Tests for amount parsing with various formats."""
    
    @pytest.mark.parametrize("input_amount,expected", [
        ("1000", 1000.0),
        ("1,000", 1000.0),
        ("1,000.50", 1000.50),
        ("₹1,000", 1000.0),
        ("Rs. 1000", 1000.0),
        ("INR 1000", 1000.0),
        ("Rs 1,500.75", 1500.75),
    ])
    def test_amount_formats(self, input_amount, expected):
        """Test various amount formats are parsed correctly."""
        result = _parse_amount(input_amount)
        assert result == expected
    
    @pytest.mark.parametrize("input_amount,expected", [
        ("(1000)", -1000.0),        # Parentheses = negative
        ("1000 Dr", -1000.0),       # Dr suffix = negative
        ("1000 Dr.", -1000.0),      # Dr. suffix = negative
        ("1000 Cr", 1000.0),        # Cr suffix = positive
    ])
    def test_debit_credit_indicators(self, input_amount, expected):
        """Test Dr/Cr and parentheses handling."""
        result = _parse_amount(input_amount)
        assert result == expected
    
    def test_invalid_amount(self):
        """Test invalid amounts return None."""
        assert _parse_amount("") is None
        assert _parse_amount("-") is None
        assert _parse_amount("N/A") is None
        assert _parse_amount(None) is None


# =============================================================================
# COLUMN DETECTION TESTS
# =============================================================================

class TestColumnDetection:
    """Tests for adaptive column detection."""
    
    def test_standard_headers(self):
        """Test detection of standard column headers."""
        headers = ["Date", "Description", "Amount", "Balance"]
        mapping = _detect_columns(headers)
        
        assert mapping.get("date") == 0
        assert mapping.get("description") == 1
        assert mapping.get("amount") == 2
        assert mapping.get("balance") == 3
    
    def test_indian_bank_headers(self):
        """Test detection of Indian bank statement headers."""
        headers = ["Value Date", "Narration", "Withdrawal Amt.", "Deposit Amt.", "Closing Balance"]
        mapping = _detect_columns(headers)
        
        assert mapping.get("date") == 0
        assert mapping.get("description") == 1
        assert mapping.get("debit") == 2
        assert mapping.get("credit") == 3
        assert mapping.get("balance") == 4
    
    def test_alternative_headers(self):
        """Test detection of alternative header names."""
        headers = ["Txn Date", "Particulars", "DR", "CR", "Avl Balance"]
        mapping = _detect_columns(headers)
        
        assert mapping.get("date") == 0
        assert mapping.get("description") == 1
        assert mapping.get("debit") == 2
        assert mapping.get("credit") == 3


# =============================================================================
# TYPE INFERENCE TESTS
# =============================================================================

class TestTypeInference:
    """Tests for transaction type inference from description."""
    
    @pytest.mark.parametrize("description,expected", [
        ("SALARY CREDIT FROM ABC LTD", "income"),
        ("NEFT-REFUND FROM AMAZON", "income"),
        ("INTEREST CREDITED", "income"),
        ("UPI RECEIVED FROM JOHN", "income"),
    ])
    def test_income_keywords(self, description, expected):
        """Test income keyword detection."""
        result = _infer_type_from_description(description)
        assert result == expected
    
    @pytest.mark.parametrize("description,expected", [
        ("SWIGGY PURCHASE", "expense"),
        ("ATM WITHDRAWAL", "expense"),
        ("EMI PAYMENT", "expense"),
        ("BILL PAYMENT ELECTRICITY", "expense"),
    ])
    def test_expense_keywords(self, description, expected):
        """Test expense keyword detection."""
        result = _infer_type_from_description(description)
        assert result == expected
    
    def test_unknown_type(self):
        """Test unknown type for ambiguous descriptions."""
        result = _infer_type_from_description("TRANSFER XYZ123")
        assert result == "unknown"


# =============================================================================
# CONFIDENCE SCORING TESTS
# =============================================================================

class TestConfidenceScoring:
    """Tests for confidence score calculation."""
    
    def test_full_confidence(self):
        """Test maximum confidence when all fields present."""
        score = _calculate_confidence(
            date="2024-01-15",
            amount=1000.0,
            description="Test transaction",
            balance=5000.0
        )
        assert score == 1.0
    
    def test_partial_confidence(self):
        """Test partial confidence with missing fields."""
        # Missing balance (10% weight)
        score = _calculate_confidence(
            date="2024-01-15",
            amount=1000.0,
            description="Test",
            balance=None
        )
        assert score == 0.9
        
        # Missing date (30% weight)
        score = _calculate_confidence(
            date=None,
            amount=1000.0,
            description="Test",
            balance=5000.0
        )
        assert score == 0.7
    
    def test_minimal_confidence(self):
        """Test low confidence with only amount."""
        score = _calculate_confidence(
            date=None,
            amount=1000.0,
            description=None,
            balance=None
        )
        assert score == 0.4  # Only amount weight
    
    def test_zero_confidence(self):
        """Test zero confidence with no valid fields."""
        score = _calculate_confidence(
            date=None,
            amount=None,
            description=None,
            balance=None
        )
        assert score == 0.0


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestParserIntegration:
    """Integration tests for full parsing flow."""
    
    def test_realistic_bank_statement(self):
        """Test parsing a realistic bank statement."""
        csv_content = b"""Transaction Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
01/01/2024,01/01/2024,Opening Balance,,,0.00,100000.00
05/01/2024,05/01/2024,NEFT-EMPLOYER INC-SALARY-JAN,NEFT12345,,75000.00,175000.00
10/01/2024,10/01/2024,UPI-SWIGGY-ORDER,UPI98765,650.00,,174350.00
15/01/2024,15/01/2024,ATM WITHDRAWAL-HDFC ATM,ATM001,5000.00,,169350.00
20/01/2024,20/01/2024,EMI-HOME LOAN-HDFC,EMI789,25000.00,,144350.00
25/01/2024,25/01/2024,UPI-AMAZON REFUND,UPIREF321,,1500.00,145850.00"""
        
        result = parse_csv_statement(csv_content)
        
        assert result.success is True
        assert len(result.transactions) == 6
        
        # Verify income transactions
        income_txns = [t for t in result.transactions if t.type == "income"]
        assert len(income_txns) == 2  # Salary and Refund
        
        # Verify expense transactions
        expense_txns = [t for t in result.transactions if t.type == "expense"]
        assert len(expense_txns) == 3  # Swiggy, ATM, EMI
        
        # Verify high confidence scores
        high_confidence = [t for t in result.transactions if t.confidence >= 0.8]
        assert len(high_confidence) >= 5
    
    def test_error_recovery(self):
        """Test parser recovers from invalid rows."""
        csv_content = b"""Date,Description,Amount,Type
15/01/2024,VALID TRANSACTION,1000,Debit
INVALID DATE,BAD TRANSACTION,NOT A NUMBER,Unknown
17/01/2024,ANOTHER VALID,2000,Credit"""
        
        result = parse_csv_statement(csv_content)
        
        assert result.success is True
        assert len(result.transactions) == 3  # All rows attempted
        
        # Check that valid transactions have good data
        valid_txns = [t for t in result.transactions if t.confidence >= 0.5]
        assert len(valid_txns) >= 2
