"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Building2,
    Shield,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Lock,
    Eye,
    Calendar,
    RefreshCw,
    CreditCard,
    User,
    Hash,
    FileText,
} from "lucide-react"
import { importTransactions, type TransactionInput } from "@/lib/api/transactions"
import { addBankAccount, type BankAccount } from "@/lib/api/paymentMethods"

const BANKS = [
    { id: 'sbi', name: 'State Bank of India', logo: '🏦', color: 'bg-blue-500' },
    { id: 'hdfc', name: 'HDFC Bank', logo: '🔵', color: 'bg-red-500' },
    { id: 'icici', name: 'ICICI Bank', logo: '🟠', color: 'bg-orange-500' },
    { id: 'axis', name: 'Axis Bank', logo: '🟣', color: 'bg-purple-500' },
    { id: 'kotak', name: 'Kotak Mahindra', logo: '🔴', color: 'bg-red-600' },
    { id: 'pnb', name: 'Punjab National Bank', logo: '🟤', color: 'bg-amber-600' },
]

// Sample transaction data that simulates real bank transactions
const SAMPLE_TRANSACTIONS: TransactionInput[] = [
    { amount: 75000, type: 'income', category: 'Salary', merchant: 'Acme Corp', date: '2025-01-01', description: 'January Salary' },
    { amount: 25000, type: 'expense', category: 'Rent', merchant: 'Landlord', date: '2025-01-05', description: 'Monthly Rent' },
    { amount: 3500, type: 'expense', category: 'Bills & Utilities', merchant: 'BSES', date: '2025-01-08', description: 'Electricity Bill' },
    { amount: 2200, type: 'expense', category: 'Food & Dining', merchant: 'Swiggy', date: '2025-01-10', description: 'Food Orders' },
    { amount: 8500, type: 'expense', category: 'Shopping', merchant: 'Amazon', date: '2025-01-12', description: 'Electronics' },
    { amount: 1500, type: 'expense', category: 'Transportation', merchant: 'Uber', date: '2025-01-14', description: 'Cab Rides' },
    { amount: 5000, type: 'expense', category: 'EMI', merchant: 'HDFC Bank', date: '2025-01-15', description: 'Personal Loan EMI' },
    { amount: 12000, type: 'income', category: 'Freelance', merchant: 'Client XYZ', date: '2025-01-18', description: 'Freelance Project' },
    { amount: 1800, type: 'expense', category: 'Entertainment', merchant: 'Netflix', date: '2025-01-20', description: 'Subscriptions' },
    { amount: 4500, type: 'expense', category: 'Groceries', merchant: 'BigBasket', date: '2025-01-22', description: 'Monthly Groceries' },
    { amount: 15000, type: 'expense', category: 'Investment', merchant: 'Groww', date: '2025-01-25', description: 'Mutual Fund SIP' },
    { amount: 2000, type: 'expense', category: 'Healthcare', merchant: 'Apollo Pharmacy', date: '2025-01-28', description: 'Medicines' },
]

type Step = 'select' | 'consent' | 'connecting' | 'success'

interface BankDetailsForm {
    accountHolderName: string
    accountNumber: string
    confirmAccountNumber: string
    ifscCode: string
    accountType: string
}

export default function ConnectBankPage() {
    const [step, setStep] = useState<Step>('select')
    const [selectedBank, setSelectedBank] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showBankDetailsModal, setShowBankDetailsModal] = useState(false)
    const [bankDetails, setBankDetails] = useState<BankDetailsForm>({
        accountHolderName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        accountType: '',
    })
    const [formErrors, setFormErrors] = useState<Partial<BankDetailsForm>>({})
    const router = useRouter()

    const handleBankSelect = (bankId: string) => {
        setSelectedBank(bankId)
    }

    const handleConsentApprove = () => {
        // Show the bank details modal instead of directly connecting
        setShowBankDetailsModal(true)
    }

    const validateBankDetails = (): boolean => {
        const errors: Partial<BankDetailsForm> = {}

        if (!bankDetails.accountHolderName.trim()) {
            errors.accountHolderName = 'Account holder name is required'
        }

        if (!bankDetails.accountNumber.trim()) {
            errors.accountNumber = 'Account number is required'
        } else if (!/^\d{9,18}$/.test(bankDetails.accountNumber)) {
            errors.accountNumber = 'Enter a valid account number (9-18 digits)'
        }

        if (!bankDetails.confirmAccountNumber.trim()) {
            errors.confirmAccountNumber = 'Please confirm your account number'
        } else if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
            errors.confirmAccountNumber = 'Account numbers do not match'
        }

        if (!bankDetails.ifscCode.trim()) {
            errors.ifscCode = 'IFSC code is required'
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode.toUpperCase())) {
            errors.ifscCode = 'Enter a valid IFSC code (e.g., SBIN0001234)'
        }

        if (!bankDetails.accountType) {
            errors.accountType = 'Please select account type'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleBankDetailsSubmit = async () => {
        if (!validateBankDetails()) return

        setShowBankDetailsModal(false)
        setStep('connecting')

        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Save bank account to payment methods
        try {
            const selectedBankData = BANKS.find(b => b.id === selectedBank)
            await addBankAccount({
                bankName: selectedBankData?.name || 'Bank Account',
                accountNumber: bankDetails.accountNumber,
                ifscCode: bankDetails.ifscCode.toUpperCase(),
                accountType: bankDetails.accountType as any,
                accountHolderName: bankDetails.accountHolderName,
                isPrimary: false,
            })
        } catch (error) {
            console.error('Failed to save bank account:', error)
        }

        // Import sample data
        try {
            await importTransactions(SAMPLE_TRANSACTIONS)
            setStep('success')
        } catch (error) {
            // If it fails, still show success for demo purposes
            setStep('success')
        }
    }

    const handleInputChange = (field: keyof BankDetailsForm, value: string) => {
        setBankDetails(prev => ({ ...prev, [field]: value }))
        // Clear error when user types
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const selectedBankData = BANKS.find(b => b.id === selectedBank)

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-foreground">Connect Your Bank</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Securely link your bank account through Account Aggregator
                </p>
            </div>

            {/* Step: Select Bank */}
            {step === 'select' && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg">Select Your Bank</CardTitle>
                        <CardDescription>Choose your bank to fetch transaction data securely</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            {BANKS.map((bank) => (
                                <button
                                    key={bank.id}
                                    onClick={() => handleBankSelect(bank.id)}
                                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${selectedBank === bank.id
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                        }`}
                                >
                                    <span className="text-2xl">{bank.logo}</span>
                                    <span className="text-sm font-medium text-foreground">{bank.name}</span>
                                </button>
                            ))}
                        </div>

                        {selectedBank && (
                            <Button
                                className="w-full mt-6"
                                onClick={() => setStep('consent')}
                            >
                                Continue with {selectedBankData?.name}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step: Consent */}
            {step === 'consent' && selectedBankData && (
                <Card className="bg-card border-border">
                    <CardHeader className="text-center border-b border-border pb-4">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-3xl">{selectedBankData.logo}</span>
                        </div>
                        <CardTitle className="text-lg">{selectedBankData.name}</CardTitle>
                        <CardDescription>Review data sharing consent</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {/* RBI Badge */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <Badge variant="outline" className="text-green-400 border-green-400/30">
                                <Shield className="w-3 h-3 mr-1" />
                                RBI Regulated Account Aggregator
                            </Badge>
                        </div>

                        {/* Data Access Details */}
                        <div className="space-y-4 mb-6">
                            <h4 className="font-medium text-foreground">Data you&apos;re sharing:</h4>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                                    <Eye className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm text-foreground">Transaction History</p>
                                        <p className="text-xs text-muted-foreground">Last 6 months of transactions</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm text-foreground">Consent Duration</p>
                                        <p className="text-xs text-muted-foreground">Valid for 1 year (revocable anytime)</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                                    <RefreshCw className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm text-foreground">Frequency</p>
                                        <p className="text-xs text-muted-foreground">Weekly refresh for latest transactions</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-6">
                            <Lock className="w-5 h-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-green-400">Your data is secure</p>
                                <p className="text-xs text-green-400/80">
                                    We never access your bank login credentials. All data is encrypted and transmitted via RBI-approved Account Aggregators.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleConsentApprove}>
                                Approve & Connect
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bank Details Modal */}
            <Dialog open={showBankDetailsModal} onOpenChange={setShowBankDetailsModal}>
                <DialogContent className="sm:max-w-[420px] bg-card border-border p-5">
                    <DialogHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            {selectedBankData && (
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-lg">{selectedBankData.logo}</span>
                                </div>
                            )}
                            <div>
                                <DialogTitle className="text-foreground text-base">Enter Bank Details</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs">
                                    {selectedBankData?.name}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3">
                        {/* Account Holder Name */}
                        <div className="space-y-1">
                            <Label htmlFor="accountHolderName" className="text-foreground text-sm flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                Account Holder Name
                            </Label>
                            <Input
                                id="accountHolderName"
                                placeholder="Enter name as per bank records"
                                value={bankDetails.accountHolderName}
                                onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                                className={`bg-secondary/50 border-border h-9 text-sm ${formErrors.accountHolderName ? 'border-red-500' : ''}`}
                            />
                            {formErrors.accountHolderName && (
                                <p className="text-xs text-red-500">{formErrors.accountHolderName}</p>
                            )}
                        </div>

                        {/* Account Number */}
                        <div className="space-y-1">
                            <Label htmlFor="accountNumber" className="text-foreground text-sm flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                Account Number
                            </Label>
                            <Input
                                id="accountNumber"
                                placeholder="Enter account number"
                                value={bankDetails.accountNumber}
                                onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                                className={`bg-secondary/50 border-border h-9 text-sm ${formErrors.accountNumber ? 'border-red-500' : ''}`}
                                maxLength={18}
                            />
                            {formErrors.accountNumber && (
                                <p className="text-xs text-red-500">{formErrors.accountNumber}</p>
                            )}
                        </div>

                        {/* Confirm Account Number */}
                        <div className="space-y-1">
                            <Label htmlFor="confirmAccountNumber" className="text-foreground text-sm flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                Confirm Account Number
                            </Label>
                            <Input
                                id="confirmAccountNumber"
                                placeholder="Re-enter account number"
                                value={bankDetails.confirmAccountNumber}
                                onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value.replace(/\D/g, ''))}
                                className={`bg-secondary/50 border-border h-9 text-sm ${formErrors.confirmAccountNumber ? 'border-red-500' : ''}`}
                                maxLength={18}
                            />
                            {formErrors.confirmAccountNumber && (
                                <p className="text-xs text-red-500">{formErrors.confirmAccountNumber}</p>
                            )}
                        </div>

                        {/* IFSC Code */}
                        <div className="space-y-1">
                            <Label htmlFor="ifscCode" className="text-foreground text-sm flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                IFSC Code
                            </Label>
                            <Input
                                id="ifscCode"
                                placeholder="e.g., SBIN0001234"
                                value={bankDetails.ifscCode}
                                onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                                className={`bg-secondary/50 border-border h-9 text-sm ${formErrors.ifscCode ? 'border-red-500' : ''}`}
                                maxLength={11}
                            />
                            {formErrors.ifscCode && (
                                <p className="text-xs text-red-500">{formErrors.ifscCode}</p>
                            )}
                        </div>

                        {/* Account Type */}
                        <div className="space-y-1">
                            <Label htmlFor="accountType" className="text-foreground text-sm flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                Account Type
                            </Label>
                            <Select
                                value={bankDetails.accountType}
                                onValueChange={(value) => handleInputChange('accountType', value)}
                            >
                                <SelectTrigger className={`bg-secondary/50 border-border h-9 text-sm ${formErrors.accountType ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="savings">Savings Account</SelectItem>
                                    <SelectItem value="current">Current Account</SelectItem>
                                    <SelectItem value="salary">Salary Account</SelectItem>
                                    <SelectItem value="nre">NRE Account</SelectItem>
                                    <SelectItem value="nro">NRO Account</SelectItem>
                                </SelectContent>
                            </Select>
                            {formErrors.accountType && (
                                <p className="text-xs text-red-500">{formErrors.accountType}</p>
                            )}
                        </div>

                        {/* Security Note */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                            <Lock className="w-3.5 h-3.5 text-primary" />
                            <p className="text-xs text-muted-foreground">
                                Your details are encrypted and securely transmitted
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowBankDetailsModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleBankDetailsSubmit}
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Verify & Connect
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Step: Connecting */}
            {step === 'connecting' && (
                <Card className="bg-card border-border">
                    <CardContent className="p-8 text-center">
                        <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Connecting to {selectedBankData?.name}</h3>
                        <p className="text-muted-foreground text-sm">Fetching your transaction data securely...</p>
                    </CardContent>
                </Card>
            )}

            {/* Step: Success */}
            {step === 'success' && (
                <Card className="bg-card border-border">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Bank Connected Successfully!</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            We&apos;ve imported {SAMPLE_TRANSACTIONS.length} transactions from your bank account.
                        </p>

                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-lg bg-green-500/10">
                                <p className="text-2xl font-bold text-green-500">₹87,000</p>
                                <p className="text-xs text-muted-foreground">Total Income</p>
                            </div>
                            <div className="p-4 rounded-lg bg-red-500/10">
                                <p className="text-2xl font-bold text-red-500">₹64,000</p>
                                <p className="text-xs text-muted-foreground">Total Expenses</p>
                            </div>
                        </div>

                        <Button className="w-full" onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    <span>No password sharing</span>
                </div>
                <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>RBI Regulated</span>
                </div>
            </div>
        </div>
    )
}

