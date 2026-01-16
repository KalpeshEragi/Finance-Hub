"use client"

import { useState } from "react"
import { GoalsOverview } from "@/components/goals/goals-overview"
import { GoalsGrid } from "@/components/goals/goals-grid"
import { AddGoalDialog } from "@/components/goals/add-goal-dialog"
import { SavingsHistory } from "@/components/goals/savings-history"
import { GoalInsights } from "@/components/goals/goal-insights"

// Sample goals data
const initialGoals = [
  {
    id: "1",
    name: "iPhone 16 Pro Max",
    icon: "📱",
    color: "#3b82f6",
    category: "Electronics",
    targetAmount: 145000,
    savedAmount: 87000,
    targetDate: new Date(2026, 5, 15),
    createdAt: new Date(2025, 10, 1),
    contributions: [
      { date: new Date(2026, 0, 10), amount: 15000 },
      { date: new Date(2026, 0, 5), amount: 10000 },
      { date: new Date(2025, 11, 20), amount: 12000 },
    ],
  },
  {
    id: "2",
    name: "Europe Trip",
    icon: "✈️",
    color: "#10b981",
    category: "Travel",
    targetAmount: 350000,
    savedAmount: 125000,
    targetDate: new Date(2026, 11, 1),
    createdAt: new Date(2025, 6, 1),
    contributions: [
      { date: new Date(2026, 0, 12), amount: 20000 },
      { date: new Date(2025, 11, 28), amount: 25000 },
    ],
  },
  {
    id: "3",
    name: "MacBook Pro M4",
    icon: "💻",
    color: "#8b5cf6",
    category: "Electronics",
    targetAmount: 250000,
    savedAmount: 250000,
    targetDate: new Date(2026, 2, 1),
    createdAt: new Date(2025, 8, 15),
    contributions: [{ date: new Date(2026, 0, 8), amount: 50000 }],
  },
  {
    id: "4",
    name: "Home Down Payment",
    icon: "🏠",
    color: "#ec4899",
    category: "Home",
    targetAmount: 1500000,
    savedAmount: 450000,
    targetDate: new Date(2028, 6, 1),
    createdAt: new Date(2025, 1, 1),
    contributions: [{ date: new Date(2026, 0, 1), amount: 50000 }],
  },
  {
    id: "5",
    name: "Wedding Gift",
    icon: "🎁",
    color: "#06b6d4",
    category: "Gift",
    targetAmount: 50000,
    savedAmount: 15000,
    targetDate: new Date(2026, 3, 20),
    createdAt: new Date(2026, 0, 5),
    contributions: [
      { date: new Date(2026, 0, 15), amount: 10000 },
      { date: new Date(2026, 0, 5), amount: 5000 },
    ],
  },
]

export default function GoalsPage() {
  const [goals, setGoals] = useState(initialGoals)

  // Calculate totals for overview
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSavedAmount = goals.reduce((sum, g) => sum + g.savedAmount, 0)
  const completedGoals = goals.filter((g) => g.savedAmount >= g.targetAmount).length

  // Get all contributions for history
  const allContributions = goals.flatMap((goal) =>
    goal.contributions.map((c) => ({
      id: `${goal.id}-${c.date.getTime()}`,
      goalName: goal.name,
      goalIcon: goal.icon,
      goalColor: goal.color,
      amount: c.amount,
      date: c.date,
    })),
  )

  const handleAddGoal = (newGoal: {
    name: string
    targetAmount: number
    duration: number
    durationType: "months" | "years"
    icon: string
    color: string
    category: string
  }) => {
    const targetDate = new Date()
    if (newGoal.durationType === "months") {
      targetDate.setMonth(targetDate.getMonth() + newGoal.duration)
    } else {
      targetDate.setFullYear(targetDate.getFullYear() + newGoal.duration)
    }

    const goal = {
      id: Date.now().toString(),
      name: newGoal.name,
      icon: newGoal.icon,
      color: newGoal.color,
      category: newGoal.category,
      targetAmount: newGoal.targetAmount,
      savedAmount: 0,
      targetDate,
      createdAt: new Date(),
      contributions: [],
    }

    setGoals([...goals, goal])
  }

  const handleAddMoney = (goalId: string, amount: number) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id === goalId) {
          return {
            ...goal,
            savedAmount: Math.min(goal.savedAmount + amount, goal.targetAmount),
            contributions: [...goal.contributions, { date: new Date(), amount }],
          }
        }
        return goal
      }),
    )
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId))
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Savings Goals</h1>
          <p className="text-sm text-muted-foreground">Track your progress towards things you want to buy</p>
        </div>
        <AddGoalDialog onAddGoal={handleAddGoal} />
      </div>

      {/* Stats Overview */}
      <GoalsOverview
        totalGoals={goals.length - completedGoals}
        totalTargetAmount={totalTargetAmount}
        totalSavedAmount={totalSavedAmount}
        completedGoals={completedGoals}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Goals Grid - Takes 3 columns */}
        <div className="lg:col-span-3">
          <GoalsGrid goals={goals} onAddMoney={handleAddMoney} onDelete={handleDeleteGoal} />
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-4">
          <GoalInsights goals={goals} />
          <SavingsHistory contributions={allContributions} />
        </div>
      </div>
    </>
  )
}
