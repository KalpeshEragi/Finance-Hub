"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Target, TrendingUp, Calendar, PiggyBank } from "lucide-react"

interface GoalsOverviewProps {
  totalGoals: number
  totalTargetAmount: number
  totalSavedAmount: number
  completedGoals: number
}

export function GoalsOverview({ totalGoals, totalTargetAmount, totalSavedAmount, completedGoals }: GoalsOverviewProps) {
  const overallProgress = totalTargetAmount > 0 ? (totalSavedAmount / totalTargetAmount) * 100 : 0
  const remainingAmount = totalTargetAmount - totalSavedAmount

  const stats = [
    {
      icon: Target,
      label: "Active Goals",
      value: totalGoals.toString(),
      subtext: `${completedGoals} completed`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: PiggyBank,
      label: "Total Saved",
      value: `₹${totalSavedAmount.toLocaleString("en-IN")}`,
      subtext: `${overallProgress.toFixed(1)}% of target`,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: TrendingUp,
      label: "Target Amount",
      value: `₹${totalTargetAmount.toLocaleString("en-IN")}`,
      subtext: `₹${remainingAmount.toLocaleString("en-IN")} remaining`,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Calendar,
      label: "Avg. Monthly Saving",
      value: `₹${Math.round(totalSavedAmount / 6).toLocaleString("en-IN")}`,
      subtext: "Last 6 months",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
