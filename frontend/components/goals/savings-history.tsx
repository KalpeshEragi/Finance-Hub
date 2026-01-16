"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Contribution {
  id: string
  goalName: string
  goalIcon: string
  goalColor: string
  amount: number
  date: Date
}

interface SavingsHistoryProps {
  contributions: Contribution[]
}

export function SavingsHistory({ contributions }: SavingsHistoryProps) {
  const sortedContributions = [...contributions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

  // Calculate this month's total
  const thisMonth = new Date()
  const thisMonthContributions = contributions.filter(
    (c) => c.date.getMonth() === thisMonth.getMonth() && c.date.getFullYear() === thisMonth.getFullYear(),
  )
  const thisMonthTotal = thisMonthContributions.reduce((sum, c) => sum + c.amount, 0)

  // Calculate last month's total for comparison
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1)
  const lastMonthContributions = contributions.filter(
    (c) => c.date.getMonth() === lastMonth.getMonth() && c.date.getFullYear() === lastMonth.getFullYear(),
  )
  const lastMonthTotal = lastMonthContributions.reduce((sum, c) => sum + c.amount, 0)

  const percentChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground">Recent Contributions</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">This month</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-foreground">₹{thisMonthTotal.toLocaleString("en-IN")}</p>
              {percentChange !== 0 && (
                <span
                  className={`flex items-center text-xs ${percentChange > 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {percentChange > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(percentChange).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedContributions.length > 0 ? (
          sortedContributions.map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: contribution.goalColor + "20" }}
                >
                  {contribution.goalIcon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{contribution.goalName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(contribution.date)}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-400">+₹{contribution.amount.toLocaleString("en-IN")}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">No contributions yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
