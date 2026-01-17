"use client"

import { useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import {
    createTransaction,
    parseStatement,
    importTransactions,
    type TransactionInput,
    type ParsedTransaction,
} from "@/lib/api/transactions"

const INCOME_CATEGORIES = [
    'Salary',
    'Freelance',
    'Investment',
    'Business',
    'Rental',
    'Gift',
    'Other',
]

const EXPENSE_CATEGORIES = [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Education',
    'Travel',
    'Groceries',
    'Rent',
    'EMI',
    'Insurance',
    'Other',
]

interface AddTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

type TabType = 'manual' | 'import'
type ImportStep = 'upload' | 'preview' | 'success'

export function AddTransactionDialog({ open, onOpenChange, onSuccess }: AddTransactionDialogProps) {
    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('manual')

    // Manual entry state
    const [type, setType] = useState<'income' | 'expense'>('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [merchant, setMerchant] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Import state
    const [importStep, setImportStep] = useState<ImportStep>('upload')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([])
    const [parseStats, setParseStats] = useState<{ total: number; successful: number; failed: number } | null>(null)
    const [importResult, setImportResult] = useState<{ created: number; categorized: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

    // Reset all state when dialog closes
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm()
        }
        onOpenChange(open)
    }

    const resetForm = () => {
        // Reset manual form
        setAmount('')
        setCategory('')
        setMerchant('')
        setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        setError(null)

        // Reset import state
        setActiveTab('manual')
        setImportStep('upload')
        setSelectedFile(null)
        setParsedTransactions([])
        setParseStats(null)
        setImportResult(null)
    }

    // ===========================================
    // MANUAL ENTRY HANDLERS
    // ===========================================

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount')
            return
        }

        if (!category) {
            setError('Please select a category')
            return
        }

        setIsLoading(true)

        try {
            const transaction: TransactionInput = {
                amount: parseFloat(amount),
                type,
                category,
                merchant: merchant || undefined,
                description: description || undefined,
                date: date || undefined,
            }

            await createTransaction(transaction)

            // Reset form fields
            setAmount('')
            setCategory('')
            setMerchant('')
            setDescription('')
            setDate(new Date().toISOString().split('T')[0])

            onSuccess()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create transaction')
        } finally {
            setIsLoading(false)
        }
    }

    // ===========================================
    // IMPORT HANDLERS
    // ===========================================

    /**
     * Validate if a date string is a valid ISO date
     */
    const isValidDate = (dateStr: string | null | undefined): boolean => {
        if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return false
        // Check if it's a valid ISO date format (YYYY-MM-DD)
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!isoDateRegex.test(dateStr)) return false
        const date = new Date(dateStr)
        return !isNaN(date.getTime())
    }

    /**
     * Validate if an amount is a valid positive number
     */
    const isValidAmount = (amount: number | null | undefined): boolean => {
        return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount > 0
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setError(null)
        }
    }

    const handleParseFile = async () => {
        if (!selectedFile) {
            setError('Please select a file')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const result = await parseStatement(selectedFile)

            if (!result.success) {
                throw new Error('Failed to parse statement')
            }

            // Strict filtering: only transactions with valid date, amount, and type
            const validTransactions = result.transactions.filter(t => {
                const hasValidDate = isValidDate(t.date)
                const hasValidAmount = isValidAmount(t.amount)
                const hasValidType = t.type === 'income' || t.type === 'expense'
                return hasValidDate && hasValidAmount && hasValidType
            })

            setParsedTransactions(validTransactions)
            setParseStats({
                total: result.total_parsed,
                successful: validTransactions.length,
                failed: result.total_parsed - validTransactions.length,
            })
            setImportStep('preview')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse statement')
        } finally {
            setIsLoading(false)
        }
    }

    const handleImportTransactions = async () => {
        if (parsedTransactions.length === 0) {
            setError('No valid transactions to import')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Double-check validation before sending to backend
            const transactionsToImport = parsedTransactions
                .filter(t =>
                    isValidDate(t.date) &&
                    isValidAmount(t.amount) &&
                    (t.type === 'income' || t.type === 'expense')
                )
                .map(t => ({
                    date: t.date!, // Guaranteed non-null by filter
                    description: t.description || '',
                    amount: Math.abs(t.amount!), // Guaranteed valid by filter
                    type: t.type as 'income' | 'expense',
                    reference: t.reference || undefined,
                    balance: t.balance || undefined,
                    category: 'Uncategorized', // Default category for imports
                }))

            if (transactionsToImport.length === 0) {
                setError('No valid transactions after validation')
                return
            }

            const result = await importTransactions(transactionsToImport)

            setImportResult(result.data)
            setImportStep('success')
            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import transactions')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDone = () => {
        resetForm()
        onOpenChange(false)
    }

    // ===========================================
    // RENDER
    // ===========================================

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>

                {/* Tab Selector */}
                <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                    <button
                        type="button"
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'manual'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => setActiveTab('manual')}
                    >
                        Manual Entry
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'import'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => setActiveTab('import')}
                    >
                        Import Statement
                    </button>
                </div>

                {/* Manual Entry Tab */}
                {activeTab === 'manual' && (
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        {/* Type Toggle */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={type === 'expense' ? 'default' : 'outline'}
                                className={`flex-1 ${type === 'expense' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                onClick={() => { setType('expense'); setCategory(''); }}
                            >
                                Expense
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'income' ? 'default' : 'outline'}
                                className={`flex-1 ${type === 'income' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                onClick={() => { setType('income'); setCategory(''); }}
                            >
                                Income
                            </Button>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-secondary border-border text-lg"
                                step="0.01"
                                min="0.01"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-secondary border-border">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Merchant */}
                        <div className="space-y-2">
                            <Label htmlFor="merchant">Merchant / Source (Optional)</Label>
                            <Input
                                id="merchant"
                                type="text"
                                placeholder="e.g., Amazon, Company Name"
                                value={merchant}
                                onChange={(e) => setMerchant(e.target.value)}
                                className="bg-secondary border-border"
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-secondary border-border"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Note (Optional)</Label>
                            <Input
                                id="description"
                                type="text"
                                placeholder="Add a note..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-secondary border-border"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Transaction'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {/* Import Statement Tab */}
                {activeTab === 'import' && (
                    <div className="space-y-4">
                        {/* Step 1: Upload */}
                        {importStep === 'upload' && (
                            <>
                                <div
                                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-sm font-medium">
                                        {selectedFile ? selectedFile.name : 'Click to upload bank statement'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Supports CSV and PDF files
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>

                                {selectedFile && (
                                    <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </span>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                        <p className="text-sm text-destructive">{error}</p>
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleParseFile}
                                        disabled={!selectedFile || isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Parsing...
                                            </>
                                        ) : (
                                            'Parse Statement'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}

                        {/* Step 2: Preview */}
                        {importStep === 'preview' && (
                            <>
                                {parseStats && (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 bg-secondary rounded-lg text-center">
                                            <p className="text-2xl font-bold">{parseStats.total}</p>
                                            <p className="text-xs text-muted-foreground">Total Rows</p>
                                        </div>
                                        <div className="p-3 bg-green-500/10 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-green-500">{parseStats.successful}</p>
                                            <p className="text-xs text-muted-foreground">Valid</p>
                                        </div>
                                        <div className="p-3 bg-red-500/10 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-red-500">{parseStats.failed}</p>
                                            <p className="text-xs text-muted-foreground">Skipped</p>
                                        </div>
                                    </div>
                                )}

                                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-secondary sticky top-0">
                                            <tr>
                                                <th className="p-2 text-left">Date</th>
                                                <th className="p-2 text-left">Description</th>
                                                <th className="p-2 text-right">Amount</th>
                                                <th className="p-2 text-center">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedTransactions.slice(0, 20).map((txn, idx) => (
                                                <tr key={idx} className="border-t border-border">
                                                    <td className="p-2 text-xs">{txn.date}</td>
                                                    <td className="p-2 text-xs truncate max-w-[150px]" title={txn.description || ''}>
                                                        {txn.description}
                                                    </td>
                                                    <td className="p-2 text-xs text-right">₹{txn.amount?.toLocaleString()}</td>
                                                    <td className="p-2 text-center">
                                                        <span className={`text-xs px-2 py-0.5 rounded ${txn.type === 'income'
                                                            ? 'bg-green-500/10 text-green-500'
                                                            : 'bg-red-500/10 text-red-500'
                                                            }`}>
                                                            {txn.type}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {parsedTransactions.length > 20 && (
                                        <p className="p-2 text-center text-xs text-muted-foreground bg-secondary">
                                            +{parsedTransactions.length - 20} more transactions
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                        <p className="text-sm text-destructive">{error}</p>
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setImportStep('upload')}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleImportTransactions}
                                        disabled={parsedTransactions.length === 0 || isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            `Import ${parsedTransactions.length} Transactions`
                                        )}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}

                        {/* Step 3: Success */}
                        {importStep === 'success' && importResult && (
                            <>
                                <div className="text-center py-8">
                                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Import Successful!</h3>
                                    <p className="text-muted-foreground">
                                        {importResult.created} transactions imported
                                    </p>
                                    {importResult.categorized > 0 && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {importResult.categorized} auto-categorized by AI
                                        </p>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button onClick={handleDone} className="w-full">
                                        Done
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
