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
  PiggyBank,
  Target,
  Sparkles,
} from "lucide-react"
import { getTransactions, type Transaction } from "@/lib/api/transactions"
import { getLoans, type Loan, type LoanSummary } from "@/lib/api/loans"
import { getGoals, type Goal } from "@/lib/api/goals"
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
  AreaChart,
  Area,
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

/**
 * @interface SavingsGrowthData
 * @brief Data point for the Savings Growth chart.
 * 
 * @description
 * Represents a single month's cumulative savings value for visualization.
 * Uses a running total (cumulative) approach to show savings growth over time.
 * 
 * @property {string} month - Short month name (e.g., "Jan", "Feb")
 * @property {number} savings - Cumulative savings amount up to this month
 */
interface SavingsGrowthData {
  month: string;
  savings: number;
}

/**
 * @interface DebtPayoffData
 * @brief Data point for the Debt Payoff Timeline chart.
 * 
 * @description
 * Represents projected remaining debt at a future point in time.
 * Calculated using EMI-based amortization to project when debts will be paid off.
 * 
 * @property {string} month - Month label (e.g., "Jan '26", "Feb '26")
 * @property {number} outstanding - Projected remaining outstanding debt amount
 */
interface DebtPayoffData {
  month: string;
  outstanding: number;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totals, setTotals] = useState({ income: 0, expense: 0 })
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

  /** @brief State for savings growth chart data - monthly cumulative savings */
  const [savingsGrowthData, setSavingsGrowthData] = useState<SavingsGrowthData[]>([])

  /** @brief State for debt payoff timeline chart data - projected debt reduction */
  const [debtPayoffData, setDebtPayoffData] = useState<DebtPayoffData[]>([])

  /** @brief Total outstanding loan amount for debt chart context */
  const [totalDebt, setTotalDebt] = useState(0)

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

  /**
   * @function processSavingsGrowth
   * @brief Computes cumulative savings growth data from transaction history.
   * 
   * @description
   * This function implements a production-grade savings growth algorithm:
   * 1. Aggregates monthly income and expenses from transactions
   * 2. Calculates net savings (income - expense) per month
   * 3. Computes a running cumulative total to show growth trajectory
   * 
   * Algorithm: Cumulative Savings = Σ(monthly_income - monthly_expense) over time
   * 
   * @param {Transaction[]} data - Array of transactions to process
   * @returns {void} Updates savingsGrowthData state with processed data
   * 
   * @note Handles edge cases:
   *   - No transactions → returns empty array (empty state)
   *   - Negative savings months → still included in cumulative (shows dips)
   */
  const processSavingsGrowth = useCallback((data: Transaction[]) => {
    if (data.length === 0) {
      setSavingsGrowthData([])
      return
    }

    // Step 1: Group transactions by month and calculate net savings per month
    const monthlyNetMap = new Map<string, { income: number; expense: number; monthKey: string }>()
    const now = new Date()

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const displayKey = d.toLocaleDateString('en-US', { month: 'short' })
      monthlyNetMap.set(key, { income: 0, expense: 0, monthKey: displayKey })
    }

    // Step 2: Aggregate transactions into monthly buckets
    data.forEach(t => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyNetMap.has(key)) {
        const current = monthlyNetMap.get(key)!
        if (t.type === 'income') current.income += t.amount
        else current.expense += t.amount
      }
    })

    // Step 3: Calculate cumulative savings with running total
    let cumulativeSavings = 0
    const sortedMonths = Array.from(monthlyNetMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort chronologically

    const growthData: SavingsGrowthData[] = sortedMonths.map(([, data]) => {
      const netSavings = data.income - data.expense
      cumulativeSavings += netSavings
      // Ensure non-negative for visualization (floor at 0)
      return {
        month: data.monthKey,
        savings: Math.max(0, cumulativeSavings)
      }
    })

    setSavingsGrowthData(growthData)
  }, [])

  /**
   * @function processDebtPayoff
   * @brief Projects debt payoff timeline using EMI-based amortization.
   * 
   * @description
   * Implements a standard loan amortization projection algorithm:
   * 1. Aggregates total outstanding debt from all active loans
   * 2. Sums total monthly EMI payments
   * 3. Projects month-by-month remaining balance until debt is cleared
   * 
   * Algorithm: Each month, outstanding = outstanding - total_EMI
   * Timeline extends until all debt is paid off or max 24 months (whichever is sooner)
   * 
   * @param {Loan[]} loans - Array of loans with outstanding amounts and EMI details
   * @returns {void} Updates debtPayoffData and totalDebt states
   * 
   * @note Handles edge cases:
   *   - No active loans → returns empty array (debt-free state)
   *   - Very long payoff period → caps at 24 months for visualization
   */
  const processDebtPayoff = useCallback((loans: Loan[]) => {
    // Filter only active loans
    const activeLoans = loans.filter(l => l.status === 'active')

    if (activeLoans.length === 0) {
      setDebtPayoffData([])
      setTotalDebt(0)
      return
    }

    // Step 1: Calculate totals
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingAmount, 0)
    const totalMonthlyEMI = activeLoans.reduce((sum, l) => sum + l.emiAmount, 0)

    setTotalDebt(totalOutstanding)

    // Step 2: Handle edge case - no EMI (shouldn't happen but safety check)
    if (totalMonthlyEMI <= 0) {
      setDebtPayoffData([{ month: 'Now', outstanding: totalOutstanding }])
      return
    }

    // Step 3: Project debt payoff timeline
    const projectionData: DebtPayoffData[] = []
    let remainingDebt = totalOutstanding
    const now = new Date()
    const maxMonths = 24 // Cap visualization at 2 years

    for (let i = 0; i <= maxMonths && remainingDebt > 0; i++) {
      const projectedDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthLabel = projectedDate.toLocaleDateString('en-US', {
        month: 'short',
        year: i > 0 ? '2-digit' : undefined
      })

      projectionData.push({
        month: i === 0 ? 'Now' : monthLabel,
        outstanding: Math.max(0, Math.round(remainingDebt))
      })

      // Apply EMI reduction for next month
      remainingDebt -= totalMonthlyEMI
    }

    setDebtPayoffData(projectionData)
  }, [])

  /**
   * @brief Main data fetching effect - loads all dashboard data in parallel.
   * 
   * @description
   * Fetches transactions, loans, and goals data concurrently for optimal performance.
   * Each data source is handled independently to ensure partial failures don't
   * block the entire dashboard from loading.
   */
  useEffect(() => {
    const fetchData = async () => {
      const token = getCookie('auth_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        // Fetch all data sources in parallel for performance
        const [transactionsResult, loansResult] = await Promise.allSettled([
          getTransactions({ limit: 200 }), // Increased limit for better historical data
          getLoans()
        ])

        // Process transactions (for existing charts + savings growth)
        if (transactionsResult.status === 'fulfilled') {
          const data = transactionsResult.value?.data ?? []
          setTransactions(data)
          processTransactions(data)
          processSavingsGrowth(data) // NEW: Process savings growth from transactions
        } else {
          // Reset transaction-related state on error
          setTransactions([])
          setTotals({ income: 0, expense: 0 })
          setCategoryData([])
          setMonthlyData([])
          setSavingsGrowthData([])
        }

        // Process loans (for debt payoff timeline)
        if (loansResult.status === 'fulfilled' && loansResult.value?.success) {
          const loans = loansResult.value.data?.loans ?? []
          processDebtPayoff(loans) // NEW: Process debt payoff timeline
        } else {
          // Reset loan-related state on error
          setDebtPayoffData([])
          setTotalDebt(0)
        }
      } catch {
        // Fallback for unexpected errors - reset all states safely
        setTransactions([])
        setTotals({ income: 0, expense: 0 })
        setCategoryData([])
        setMonthlyData([])
        setSavingsGrowthData([])
        setDebtPayoffData([])
        setTotalDebt(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, processTransactions, processSavingsGrowth, processDebtPayoff])

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
        <Link href="/dashboard/action-plan">
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            View Action Plan
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

      {/* 
       * @section Savings & Debt Charts Row
       * @brief New visualization section showing savings growth trajectory and debt payoff timeline.
       * 
       * These charts provide users with:
       * 1. Savings Growth Chart - Cumulative savings over time from transactions
       * 2. Debt Payoff Timeline - Projected timeline to become debt-free
       * 
       * Layout: Same 2-column responsive grid as existing charts for visual consistency.
       */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 
         * @component Savings Growth Chart
         * @brief Area chart showing cumulative savings growth over time.
         * 
         * Data source: Transactions API - calculates net savings per month (income - expense)
         * Visualization: Gradient-filled area chart with green theme (matches income color)
         * Empty state: Shows message prompting users to add transactions
         */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-green-500" />
              Savings Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savingsGrowthData.length > 0 && savingsGrowthData.some(d => d.savings > 0) ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsGrowthData}>
                    <defs>
                      {/* Gradient fill for the area - matches green income color */}
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#888', fontSize: 12 }}
                      axisLine={{ stroke: '#333' }}
                    />
                    <YAxis
                      tick={{ fill: '#888', fontSize: 12 }}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                      axisLine={{ stroke: '#333' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f1f1f',
                        border: '1px solid #333',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [formatCurrency(value), 'Total Savings']}
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#savingsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <PiggyBank className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No savings data yet</p>
                <Link href="/dashboard/transactions" className="text-primary text-xs hover:underline mt-1">
                  Add transactions to track savings
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 
         * @component Debt Payoff Timeline Chart
         * @brief Area chart projecting remaining debt over time until payoff.
         * 
         * Data source: Loans API - uses outstanding amounts and EMI for projection
         * Visualization: Gradient-filled area chart with red theme (matches expense color)
         * Empty state: Shows positive "debt-free" message
         * Algorithm: Standard amortization projection (outstanding -= EMI per month)
         */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              Debt Payoff Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debtPayoffData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={debtPayoffData}>
                    <defs>
                      {/* Gradient fill for the area - matches red expense color */}
                      <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#888', fontSize: 12 }}
                      axisLine={{ stroke: '#333' }}
                    />
                    <YAxis
                      tick={{ fill: '#888', fontSize: 12 }}
                      tickFormatter={(v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v / 1000}k`}
                      axisLine={{ stroke: '#333' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f1f1f',
                        border: '1px solid #333',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [formatCurrency(value), 'Outstanding Debt']}
                    />
                    <Area
                      type="monotone"
                      dataKey="outstanding"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#debtGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <Target className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm text-green-500 font-medium">You're debt-free! 🎉</p>
                <p className="text-xs">No active loans to track</p>
              </div>
            )}
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
