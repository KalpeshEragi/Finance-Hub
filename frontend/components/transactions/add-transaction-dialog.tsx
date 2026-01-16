"use client"

import { useState } from "react"
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
import { Loader2 } from "lucide-react"
import { createTransaction, type TransactionInput } from "@/lib/api/transactions"

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

export function AddTransactionDialog({ open, onOpenChange, onSuccess }: AddTransactionDialogProps) {
    const [type, setType] = useState<'income' | 'expense'>('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [merchant, setMerchant] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

    const handleSubmit = async (e: React.FormEvent) => {
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

            // Reset form
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
            </DialogContent>
        </Dialog>
    )
}
