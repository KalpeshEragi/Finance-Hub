"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, TrendingUp, Target, AlertTriangle } from "lucide-react"

interface Goal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  targetDate: Date
}

interface GoalInsightsProps {
  goals: Goal[]
  monthlyIncome?: number
}

export function GoalInsights({ goals, monthlyIncome = 50000 }: GoalInsightsProps) {
  const activeGoals = goals.filter((g) => g.savedAmount < g.targetAmount)
  const totalRemaining = activeGoals.reduce((sum, g) => sum + (g.targetAmount - g.savedAmount), 0)

  // Calculate average months to complete all goals
  const avgMonthsRemaining =
    activeGoals.reduce((sum, g) => {
      const daysLeft = Math.ceil((g.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return sum + Math.ceil(daysLeft / 30)
    }, 0) / (activeGoals.length || 1)

  // Find goals that need attention
  const urgentGoals = activeGoals.filter((g) => {
    const daysLeft = Math.ceil((g.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const remaining = g.targetAmount - g.savedAmount
    const requiredMonthly = remaining / Math.max(Math.ceil(daysLeft / 30), 1)
    return requiredMonthly > monthlyIncome * 0.3 // More than 30% of income needed
  })

  // Calculate recommended monthly saving
  const recommendedMonthlySaving = Math.min(totalRemaining / Math.max(avgMonthsRemaining, 1), monthlyIncome * 0.3)

  const insights = [
    {
      icon: TrendingUp,
      title: "Recommended Monthly Saving",
      value: `₹${Math.ceil(recommendedMonthlySaving).toLocaleString("en-IN")}`,
      description: "Based on your goals and timeline",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Target,
      title: "Total Remaining",
      value: `₹${totalRemaining.toLocaleString("en-IN")}`,
      description: `Across ${activeGoals.length} active goals`,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: urgentGoals.length > 0 ? AlertTriangle : Lightbulb,
      title: urgentGoals.length > 0 ? "Goals Need Attention" : "All Goals On Track",
      value: urgentGoals.length > 0 ? urgentGoals.length.toString() : "✓",
      description:
        urgentGoals.length > 0 ? `${urgentGoals.map((g) => g.name).join(", ")} need more focus` : "You're doing great!",
      color: urgentGoals.length > 0 ? "text-amber-400" : "text-emerald-400",
      bgColor: urgentGoals.length > 0 ? "bg-amber-500/10" : "bg-emerald-500/10",
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.title} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
            <div className={`p-2 rounded-lg ${insight.bgColor}`}>
              <insight.icon className={`w-4 h-4 ${insight.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{insight.title}</p>
                <p className={`text-lg font-semibold ${insight.color}`}>{insight.value}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{insight.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
