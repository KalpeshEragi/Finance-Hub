/**
 * @file paymentMethods.ts
 * @description API functions for payment methods management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: string;
    accountHolderName: string;
    isPrimary: boolean;
}

export interface CreditCard {
    id: string;
    cardNumberMasked: string;
    cardLast4Digits: string;
    creditLimit: number;
    expiryMonth: number;
    expiryYear: number;
    cardType: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'diners' | 'discover';
    cardNickname?: string;
}

export interface UpiAccount {
    id: string;
    upiId: string;
}

export interface PaymentMethodCounts {
    bankAccounts: number;
    creditCards: number;
    upiAccounts: number;
    total?: number;
}

export interface PaymentMethodsResponse {
    success: boolean;
    data: {
        bankAccounts: BankAccount[];
        creditCards: CreditCard[];
        upiAccounts: UpiAccount[];
        counts: PaymentMethodCounts;
    };
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
}

function getAuthHeaders(): HeadersInit {
    const token = getCookie('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

/**
 * Get all payment methods
 */
export async function getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const response = await fetch(`${API_BASE_URL}/payment-methods`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch payment methods');
    return data;
}

/**
 * Get payment method counts only
 */
export async function getPaymentMethodCounts(): Promise<{ success: boolean; data: PaymentMethodCounts }> {
    const response = await fetch(`${API_BASE_URL}/payment-methods/counts`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch counts');
    return data;
}

/**
 * Add a bank account
 */
export async function addBankAccount(bankAccount: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: string;
    accountHolderName: string;
    isPrimary?: boolean;
}): Promise<{ success: boolean; data: BankAccount; message: string }> {
    const response = await fetch(`${API_BASE_URL}/payment-methods/bank`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bankAccount),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add bank account');
    return data;
}

/**
 * Add a credit card
 */
export async function addCreditCard(creditCard: {
    cardNumber: string;
    cvv: string;
    creditLimit: number;
    expiryMonth: number;
    expiryYear: number;
    cardType: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'diners' | 'discover';
    cardNickname?: string;
}): Promise<{ success: boolean; data: CreditCard; message: string }> {
    const response = await fetch(`${API_BASE_URL}/payment-methods/credit-card`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(creditCard),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add credit card');
    return data;
}

/**
 * Add a UPI ID
 */
export async function addUpiId(upiId: string): Promise<{ success: boolean; data: UpiAccount; message: string }> {
    const response = await fetch(`${API_BASE_URL}/payment-methods/upi`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ upiId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add UPI ID');
    return data;
}

/**
 * Delete a payment method
 */
export async function deletePaymentMethod(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/payment-methods/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to remove payment method');
    return data;
}
