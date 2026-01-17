"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Tags,
    Search,
    ArrowUpCircle,
    ArrowDownCircle,
    Heart,
    ShoppingBag,
    Utensils,
    Car,
    Lightbulb,
    Film,
    GraduationCap,
    Plane,
    Home,
    Briefcase,
    Gift,
    MoreHorizontal,
    TrendingUp,
    TrendingDown,
} from "lucide-react"

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

interface Category {
    id: string
    name: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    bgColor: string
    description: string
}

const CATEGORIES: Category[] = [
    { id: "health", name: "Health & Medical", icon: Heart, color: "text-red-400", bgColor: "bg-red-500/20", description: "Medical bills, pharmacy, insurance" },
    { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "text-purple-400", bgColor: "bg-purple-500/20", description: "Clothing, electronics, accessories" },
    { id: "food", name: "Food & Dining", icon: Utensils, color: "text-orange-400", bgColor: "bg-orange-500/20", description: "Restaurants, groceries, delivery" },
    { id: "transport", name: "Transportation", icon: Car, color: "text-blue-400", bgColor: "bg-blue-500/20", description: "Fuel, cab, public transport" },
    { id: "utilities", name: "Bills & Utilities", icon: Lightbulb, color: "text-yellow-400", bgColor: "bg-yellow-500/20", description: "Electricity, water, internet, phone" },
    { id: "entertainment", name: "Entertainment", icon: Film, color: "text-pink-400", bgColor: "bg-pink-500/20", description: "Movies, subscriptions, games" },
    { id: "education", name: "Education", icon: GraduationCap, color: "text-indigo-400", bgColor: "bg-indigo-500/20", description: "Courses, books, tuition" },
    { id: "travel", name: "Travel", icon: Plane, color: "text-cyan-400", bgColor: "bg-cyan-500/20", description: "Flights, hotels, vacations" },
    { id: "housing", name: "Housing & Rent", icon: Home, color: "text-emerald-400", bgColor: "bg-emerald-500/20", description: "Rent, maintenance, repairs" },
    { id: "salary", name: "Salary & Income", icon: Briefcase, color: "text-green-400", bgColor: "bg-green-500/20", description: "Salary, freelance, bonuses" },
    { id: "gifts", name: "Gifts & Donations", icon: Gift, color: "text-rose-400", bgColor: "bg-rose-500/20", description: "Gifts, charity, donations" },
    { id: "miscellaneous", name: "Miscellaneous", icon: MoreHorizontal, color: "text-gray-400", bgColor: "bg-gray-500/20", description: "Other uncategorized expenses" },
]

// =============================================================================
// MOCK DATA
// =============================================================================

interface MockTransaction {
    id: string
    description: string
    amount: number
    type: "income" | "expense"
    categoryId: string
    date: string
    merchant?: string
}

const MOCK_TRANSACTIONS: MockTransaction[] = [
    { id: "1", description: "Monthly Salary", amount: 85000, type: "income", categoryId: "salary", date: "2026-01-15", merchant: "TechCorp Pvt Ltd" },
    { id: "2", description: "Freelance Project", amount: 25000, type: "income", categoryId: "salary", date: "2026-01-10", merchant: "ABC Consulting" },
    { id: "3", description: "Grocery Shopping", amount: 4500, type: "expense", categoryId: "food", date: "2026-01-14", merchant: "BigBasket" },
    { id: "4", description: "Zomato Order", amount: 650, type: "expense", categoryId: "food", date: "2026-01-13", merchant: "Zomato" },
    { id: "5", description: "Restaurant Dinner", amount: 2200, type: "expense", categoryId: "food", date: "2026-01-12", merchant: "BBQ Nation" },
    { id: "6", description: "Petrol", amount: 3000, type: "expense", categoryId: "transport", date: "2026-01-11", merchant: "HP Petrol Pump" },
    { id: "7", description: "Uber Rides", amount: 1500, type: "expense", categoryId: "transport", date: "2026-01-10" },
    { id: "8", description: "Electricity Bill", amount: 2800, type: "expense", categoryId: "utilities", date: "2026-01-08", merchant: "BESCOM" },
    { id: "9", description: "Internet Bill", amount: 999, type: "expense", categoryId: "utilities", date: "2026-01-07", merchant: "Jio Fiber" },
    { id: "10", description: "Netflix Subscription", amount: 649, type: "expense", categoryId: "entertainment", date: "2026-01-05", merchant: "Netflix" },
    { id: "11", description: "Movie Tickets", amount: 800, type: "expense", categoryId: "entertainment", date: "2026-01-04", merchant: "BookMyShow" },
    { id: "12", description: "Amazon Shopping", amount: 5600, type: "expense", categoryId: "shopping", date: "2026-01-03", merchant: "Amazon" },
    { id: "13", description: "Myntra Purchase", amount: 3200, type: "expense", categoryId: "shopping", date: "2026-01-02", merchant: "Myntra" },
    { id: "14", description: "Doctor Consultation", amount: 800, type: "expense", categoryId: "health", date: "2026-01-01", merchant: "Apollo Clinic" },
    { id: "15", description: "Medicines", amount: 1200, type: "expense", categoryId: "health", date: "2025-12-31", merchant: "MedPlus" },
    { id: "16", description: "Gym Membership", amount: 2500, type: "expense", categoryId: "health", date: "2025-12-28" },
    { id: "17", description: "Monthly Rent", amount: 25000, type: "expense", categoryId: "housing", date: "2026-01-01", merchant: "Landlord" },
    { id: "18", description: "Home Maintenance", amount: 1500, type: "expense", categoryId: "housing", date: "2025-12-25" },
    { id: "19", description: "Udemy Course", amount: 499, type: "expense", categoryId: "education", date: "2025-12-20", merchant: "Udemy" },
    { id: "20", description: "Books", amount: 1200, type: "expense", categoryId: "education", date: "2025-12-18", merchant: "Amazon Books" },
    { id: "21", description: "Flight Tickets", amount: 8500, type: "expense", categoryId: "travel", date: "2025-12-15", merchant: "MakeMyTrip" },
    { id: "22", description: "Hotel Booking", amount: 6000, type: "expense", categoryId: "travel", date: "2025-12-15", merchant: "OYO" },
    { id: "23", description: "Birthday Gift", amount: 2000, type: "expense", categoryId: "gifts", date: "2025-12-12" },
    { id: "24", description: "Charity Donation", amount: 5000, type: "expense", categoryId: "gifts", date: "2025-12-10", merchant: "CRY India" },
    { id: "25", description: "ATM Withdrawal", amount: 10000, type: "expense", categoryId: "miscellaneous", date: "2025-12-08" },
    { id: "26", description: "Bank Charges", amount: 150, type: "expense", categoryId: "miscellaneous", date: "2025-12-05", merchant: "HDFC Bank" },
    { id: "27", description: "Bonus", amount: 15000, type: "income", categoryId: "salary", date: "2025-12-25", merchant: "TechCorp Pvt Ltd" },
]

// =============================================================================
// COMPONENT
// =============================================================================

export default function CategoriesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Calculate category totals
    const categoryTotals = useMemo(() => {
        const totals: Record<string, { income: number; expense: number; count: number }> = {}

        CATEGORIES.forEach(cat => {
            totals[cat.id] = { income: 0, expense: 0, count: 0 }
        })

        MOCK_TRANSACTIONS.forEach(tx => {
            if (totals[tx.categoryId]) {
                totals[tx.categoryId].count++
                if (tx.type === "income") {
                    totals[tx.categoryId].income += tx.amount
                } else {
                    totals[tx.categoryId].expense += tx.amount
                }
            }
        })

        return totals
    }, [])

    // Filter transactions by selected category and search
    const filteredTransactions = useMemo(() => {
        let transactions = MOCK_TRANSACTIONS

        if (selectedCategory) {
            transactions = transactions.filter(tx => tx.categoryId === selectedCategory)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            transactions = transactions.filter(tx =>
                tx.description.toLowerCase().includes(query) ||
                tx.merchant?.toLowerCase().includes(query)
            )
        }

        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [selectedCategory, searchQuery])

    // Summary totals
    const summaryTotals = useMemo(() => {
        const totalIncome = MOCK_TRANSACTIONS.filter(tx => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0)
        const totalExpense = MOCK_TRANSACTIONS.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0)
        return { totalIncome, totalExpense, net: totalIncome - totalExpense }
    }, [])

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

    const selectedCategoryData = selectedCategory
        ? CATEGORIES.find(c => c.id === selectedCategory)
        : null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                        <Tags className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Categories</h1>
                        <p className="text-sm text-muted-foreground">
                            Browse and filter your expenses by category
                        </p>
                    </div>
                </div>
                {selectedCategory && (
                    <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                        Clear Filter
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Income</p>
                                <p className="text-xl font-semibold text-green-500">{formatCurrency(summaryTotals.totalIncome)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Expenses</p>
                                <p className="text-xl font-semibold text-red-500">{formatCurrency(summaryTotals.totalExpense)}</p>
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
                                <p className={`text-xl font-semibold ${summaryTotals.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(summaryTotals.net)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Grid */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    {selectedCategory ? "Selected Category" : "All Categories"}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {CATEGORIES.map((category) => {
                        const totals = categoryTotals[category.id]
                        const isSelected = selectedCategory === category.id
                        const CategoryIcon = category.icon

                        return (
                            <Card
                                key={category.id}
                                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${isSelected
                                        ? 'ring-2 ring-primary bg-primary/5'
                                        : 'bg-card border-border hover:bg-secondary/50'
                                    }`}
                                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                            >
                                <CardContent className="p-4">
                                    <div className={`p-3 rounded-xl ${category.bgColor} w-fit mb-3`}>
                                        <CategoryIcon className={`w-6 h-6 ${category.color}`} />
                                    </div>
                                    <h3 className="font-medium text-foreground text-sm mb-1">{category.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{category.description}</p>
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary" className="text-xs">
                                            {totals.count} txns
                                        </Badge>
                                        <span className="text-xs font-medium text-red-400">
                                            {totals.expense > 0 ? `-${formatCurrency(totals.expense).replace('₹', '₹')}` : '₹0'}
                                        </span>
                                    </div>
                                    {totals.income > 0 && (
                                        <span className="text-xs font-medium text-green-400 block mt-1">
                                            +{formatCurrency(totals.income)}
                                        </span>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Transactions List */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">
                                {selectedCategoryData ? selectedCategoryData.name : "All"} Transactions
                            </CardTitle>
                            <CardDescription>
                                {filteredTransactions.length} transactions found
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-secondary border-border"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Tags className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No transactions found.</p>
                            {selectedCategory && (
                                <Button variant="link" onClick={() => setSelectedCategory(null)} className="mt-2">
                                    Clear filter
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTransactions.map((transaction) => {
                                const category = CATEGORIES.find(c => c.id === transaction.categoryId)
                                const CategoryIcon = category?.icon || MoreHorizontal

                                return (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${category?.bgColor || 'bg-gray-500/20'}`}>
                                                <CategoryIcon className={`w-4 h-4 ${category?.color || 'text-gray-400'}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {transaction.merchant || transaction.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={`${category?.bgColor} ${category?.color} text-xs`}>
                                                        {category?.name || "Other"}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(transaction.date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {transaction.type === 'income' ? (
                                                <ArrowUpCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
