"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Search,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    IndianRupee,
    Calendar,
    Loader2,
    ChevronRight,
    Filter
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { getBudgetSummary, setBudget, getBudgetAdvice, type BudgetWithSpending, type BudgetAdviceResponse } from "@/lib/api/budget"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

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

export default function BudgetPage() {
    const [budgets, setBudgets] = useState<BudgetWithSpending[]>([])
    const [totalBudget, setTotalBudget] = useState(0)
    const [totalSpent, setTotalSpent] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    // Budget Agent State
    const [advice, setAdvice] = useState<BudgetAdviceResponse | null>(null)
    const [adviceLoading, setAdviceLoading] = useState(false)

    // Form state
    const [selectedCategory, setSelectedCategory] = useState('')
    const [customCategoryName, setCustomCategoryName] = useState('')
    const [limit, setLimit] = useState('')
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())

    const fetchSummary = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await getBudgetSummary(month, year)
            const data = response?.data
            setBudgets(data?.budgets ?? [])
            setTotalBudget(data?.totalBudget ?? 0)
            setTotalSpent(data?.totalSpent ?? 0)

            // Fetch Advice
            setAdviceLoading(true)
            try {
                const adviceRes = await getBudgetAdvice()
                setAdvice(adviceRes?.data)
            } catch (e) {
                console.error("Failed to fetch advice", e)
            } finally {
                setAdviceLoading(false)
            }

        } catch (error) {
            // Reset to safe defaults on error
            setBudgets([])
            setTotalBudget(0)
            setTotalSpent(0)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load budget data",
            })
        } finally {
            setIsLoading(false)
        }
    }, [month, year, toast])

    useEffect(() => {
        fetchSummary()
    }, [fetchSummary])

    const handleSetBudget = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCategory || !limit) return
        if (selectedCategory === 'Other' && !customCategoryName.trim()) return

        const categoryName = selectedCategory === 'Other' ? customCategoryName.trim() : selectedCategory

        setIsSaving(true)
        try {
            await setBudget({
                category: categoryName,
                limit: parseFloat(limit),
                month,
                year,
            })

            toast({
                title: "Success",
                description: `Budget set for ${categoryName}`,
            })

            setIsDialogOpen(false)
            setSelectedCategory('')
            setCustomCategoryName('')
            setLimit('')
            fetchSummary()
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to set budget",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    const remainingTotal = Math.max(0, totalBudget - totalSpent)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Budgeting</h1>
                    <p className="text-sm text-muted-foreground">Manage your spending limits and track savings</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                        <SelectTrigger className="w-[130px] bg-secondary border-border">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                            {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Set Budget
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading budget data...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-card border-border">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <IndianRupee className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-foreground">₹{totalBudget?.toLocaleString() ?? "0"}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                                    <div className="p-2 rounded-lg bg-secondary">
                                        <TrendingUp className="w-4 h-4 text-foreground" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-foreground">₹{totalSpent?.toLocaleString() ?? "0"}</h3>
                                    <span className={cn("text-xs", overallPercentage > 90 ? "text-red-400" : "text-emerald-400")}>
                                        {overallPercentage.toFixed(1)}% used
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                                    <div className="p-2 rounded-lg bg-emerald-500/10">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-foreground">₹{remainingTotal?.toLocaleString() ?? "0"}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Overall Progress */}
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Monthly Progress</h3>
                                <Badge variant="outline" className={cn(
                                    "border-border font-normal",
                                    overallPercentage > 100 ? "text-red-400 border-red-400/30 bg-red-400/10" : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                                )}>
                                    {overallPercentage > 100 ? "Limit Exceeded" : "Under Control"}
                                </Badge>
                            </div>
                            <Progress value={Math.min(overallPercentage, 100)} className="h-3 bg-secondary" />
                            <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                                <span>Spent ₹{totalSpent?.toLocaleString() ?? "0"}</span>
                                <span>Budget ₹{totalBudget?.toLocaleString() ?? "0"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Budget Agent Advice */}
                    <Card className="bg-card border-border mb-6">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🤖</span>
                                <div>
                                    <CardTitle>Money Council: Budget Agent</CardTitle>
                                    <CardDescription>Personalized recommendations to save money</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {adviceLoading ? (
                                <div className="space-y-4">
                                    <div className="h-4 bg-secondary rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-secondary rounded w-1/2 animate-pulse"></div>
                                </div>
                            ) : advice ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground mb-1">Potential Monthly Savings</p>
                                            <p className="text-2xl font-bold text-primary">₹{advice.estimated_monthly_savings.toLocaleString()}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground mb-1">Discretionary Spending</p>
                                            <p className="text-xl font-semibold text-foreground">₹{advice.wants_spending.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            Top Areas to Reduce
                                        </h4>
                                        <div className="space-y-3">
                                            {advice.recommendations.map((rec, idx) => (
                                                <div key={idx} className="p-4 rounded-lg border border-border bg-secondary/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h5 className="font-semibold text-foreground">{rec.category}</h5>
                                                            <p className="text-xs text-muted-foreground">Current: ₹{rec.current_spending.toLocaleString()}</p>
                                                        </div>
                                                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                                                            Save ₹{rec.potential_savings.toLocaleString()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                                                    <div className="flex items-center gap-2 text-sm text-foreground bg-card p-2 rounded border border-border">
                                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                                        {rec.action_item}
                                                    </div>
                                                </div>
                                            ))}
                                            {advice.recommendations.length === 0 && (
                                                <p className="text-muted-foreground text-sm italic">Great job! Your spending looks optimized.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No advice available yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Category Budgets */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-card border-border lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Category Breakdown</CardTitle>
                                    <CardDescription>Spending limits for each category</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {budgets.length > 0 ? budgets.map((budget) => (
                                        <div key={budget.id} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground">{budget.category}</span>
                                                    {budget.status === 'exceeded' && (
                                                        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20">
                                                            Over Budget
                                                        </Badge>
                                                    )}
                                                    {budget.status === 'warning' && (
                                                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
                                                            Warning
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm">
                                                    <span className="text-foreground font-semibold">₹{budget.spent.toLocaleString()}</span>
                                                    <span className="text-muted-foreground ml-1">of ₹{budget.limit.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <Progress
                                                value={Math.min(budget.percentage, 100)}
                                                className={cn(
                                                    "h-2 bg-secondary",
                                                    budget.status === 'exceeded' ? "bg-red-500/20" : budget.status === 'warning' ? "bg-amber-500/20" : "",
                                                    // The indicator styling is now part of the main className
                                                    budget.status === 'exceeded' ? "[&>div]:bg-red-500" : budget.status === 'warning' ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary"
                                                )}
                                            />
                                        </div>
                                    )) : (
                                        <div className="text-center py-12">
                                            <p className="text-4xl mb-3">⚖️</p>
                                            <h3 className="text-lg font-medium text-foreground mb-2">No budgets set</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Set category-wise spending limits to better manage your money.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Set Budget Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-card border-border sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Set Spending Limit</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Define a monthly budget for a specific category.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSetBudget} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="bg-secondary border-border text-foreground">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedCategory === 'Other' && (
                            <div className="space-y-2">
                                <Label htmlFor="customName">Category Name</Label>
                                <Input
                                    id="customName"
                                    type="text"
                                    placeholder="Enter custom category name"
                                    value={customCategoryName}
                                    onChange={(e) => setCustomCategoryName(e.target.value)}
                                    className="bg-secondary border-border text-foreground"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="limit">Monthly Limit (₹)</Label>
                            <Input
                                id="limit"
                                type="number"
                                placeholder="e.g., 5000"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                className="bg-secondary border-border text-foreground"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving || !selectedCategory || !limit || (selectedCategory === 'Other' && !customCategoryName.trim())} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Budget'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
