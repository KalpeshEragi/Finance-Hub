"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowRight,
  PieChart,
  BarChart3,
  EyeOff,
} from "lucide-react"
import { getTransactions, type Transaction } from "@/lib/api/transactions"
import { useSecuritySettings } from "@/lib/context/security-context"
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

// Cookie utility
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

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totals, setTotals] = useState({ income: 0, expense: 0 })
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const router = useRouter()

  // Get hideBalances from security context
  const { hideBalances } = useSecuritySettings()

  const processTransactions = useCallback((data: Transaction[]) => {
    // Calculate totals
    const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    setTotals({ income, expense })

    // Category breakdown (expenses only)
    const categoryMap = new Map<string, number>()
    data.filter(t => t.type === 'expense').forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount)
    })
    const catData: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
    setCategoryData(catData)

    // Monthly trends (last 6 months)
    const monthMap = new Map<string, { income: number; expense: number }>()
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('en-US', { month: 'short' })
      monthMap.set(key, { income: 0, expense: 0 })
    }
    data.forEach(t => {
      const d = new Date(t.date)
      const key = d.toLocaleDateString('en-US', { month: 'short' })
      if (monthMap.has(key)) {
        const current = monthMap.get(key)!
        if (t.type === 'income') current.income += t.amount
        else current.expense += t.amount
      }
    })
    setMonthlyData(Array.from(monthMap.entries()).map(([month, data]) => ({ month, ...data })))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const token = getCookie('auth_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        const response = await getTransactions({ limit: 100 })
        const data = response?.data ?? []
        setTransactions(data)
        processTransactions(data)
      } catch {
        // Reset to safe defaults on error
        setTransactions([])
        setTotals({ income: 0, expense: 0 })
        setCategoryData([])
        setMonthlyData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, processTransactions])

  const formatCurrency = (amount: number) => {
    if (hideBalances) {
      return "₹••••••"
    }
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
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const netBalance = totals.income - totals.expense
  const savingsRate = totals.income > 0 ? ((netBalance / totals.income) * 100).toFixed(0) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your financial overview at a glance</p>
        </div>
        <Link href="/dashboard/transactions">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ArrowUpCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
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
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-xl font-semibold text-red-500">{formatCurrency(totals.expense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className={`text-xl font-semibold ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(netBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hideBalances ? 'bg-gray-500/10' : Number(savingsRate) >= 20 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                {hideBalances ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : Number(savingsRate) >= 20 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className={`text-xl font-semibold ${hideBalances ? 'text-gray-400' : Number(savingsRate) >= 20 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {hideBalances ? "••%" : `${savingsRate}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Expense by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-foreground">{cat.name}</span>
                      </div>
                      <span className="text-muted-foreground">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                No expense data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions yet.</p>
              <Link href="/dashboard/transactions" className="text-primary text-sm hover:underline">
                Add your first transaction
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
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
                      <p className="font-medium text-foreground text-sm">
                        {transaction.merchant || transaction.description || transaction.category}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
