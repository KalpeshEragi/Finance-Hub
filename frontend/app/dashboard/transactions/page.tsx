"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    ArrowUpCircle,
    ArrowDownCircle,
    Filter,
    Search,
    Upload,
    Trash2,
    Edit
} from "lucide-react"
import { getTransactions, deleteTransaction, type Transaction } from "@/lib/api/transactions"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { CSVImportDialog } from "@/components/transactions/csv-import-dialog"

const CATEGORY_COLORS: Record<string, string> = {
    'Salary': 'bg-green-500/20 text-green-400',
    'Food & Dining': 'bg-orange-500/20 text-orange-400',
    'Shopping': 'bg-purple-500/20 text-purple-400',
    'Transportation': 'bg-blue-500/20 text-blue-400',
    'Bills & Utilities': 'bg-red-500/20 text-red-400',
    'Entertainment': 'bg-pink-500/20 text-pink-400',
    'Healthcare': 'bg-cyan-500/20 text-cyan-400',
    'Investment': 'bg-emerald-500/20 text-emerald-400',
    'Freelance': 'bg-yellow-500/20 text-yellow-400',
    'Other': 'bg-gray-500/20 text-gray-400',
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

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showImportDialog, setShowImportDialog] = useState(false)
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
    const [totals, setTotals] = useState({ income: 0, expense: 0 })
    const router = useRouter()

    const fetchTransactions = useCallback(async () => {
        const token = getCookie('auth_token')
        if (!token) {
            router.push('/auth/login')
            return
        }

        try {
            setIsLoading(true)
            const filters = typeFilter !== 'all' ? { type: typeFilter } : {}
            const response = await getTransactions({ ...filters, limit: 50 })
            const data = response?.data ?? []
            setTransactions(data)

            // Calculate totals
            const income = data
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)
            const expense = data
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
            setTotals({ income, expense })
        } catch (err) {
            setTransactions([])
            setTotals({ income: 0, expense: 0 })
            setError(err instanceof Error ? err.message : 'Failed to load transactions')
        } finally {
            setIsLoading(false)
        }
    }, [router, typeFilter])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return

        try {
            await deleteTransaction(id)
            fetchTransactions()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
                    <p className="text-muted-foreground text-sm mt-1">Track your income and expenses</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                    </Button>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <ArrowUpCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Income</p>
                                <p className="text-xl font-semibold text-green-500">{formatCurrency(totals.income)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <ArrowDownCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Expenses</p>
                                <p className="text-xl font-semibold text-red-500">{formatCurrency(totals.expense)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <span className="text-primary text-lg font-bold">₹</span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Net Balance</p>
                                <p className={`text-xl font-semibold ${totals.income - totals.expense >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(totals.income - totals.expense)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <Button
                    variant={typeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter('all')}
                >
                    All
                </Button>
                <Button
                    variant={typeFilter === 'income' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter('income')}
                >
                    Income
                </Button>
                <Button
                    variant={typeFilter === 'expense' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter('expense')}
                >
                    Expenses
                </Button>
            </div>

            {/* Transactions List */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="text-center py-8 text-destructive">{error}</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No transactions yet.</p>
                            <p className="text-sm mt-1">Add your first transaction to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            {transaction.type === 'income' ? (
                                                <ArrowUpCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {transaction.merchant || transaction.description || transaction.category}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className={CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS['Other']}>
                                                    {transaction.category}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{formatDate(transaction.date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                        </span>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(transaction.id)}>
                                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <AddTransactionDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onSuccess={fetchTransactions}
            />
            <CSVImportDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                onSuccess={fetchTransactions}
            />
        </div>
    )
}
