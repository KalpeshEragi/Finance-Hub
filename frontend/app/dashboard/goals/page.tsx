"use client"

import { useState, useEffect, useCallback } from "react"
import { GoalsOverview } from "@/components/goals/goals-overview"
import { GoalsGrid } from "@/components/goals/goals-grid"
import { AddGoalDialog } from "@/components/goals/add-goal-dialog"
import { SavingsHistory } from "@/components/goals/savings-history"
import { GoalInsights } from "@/components/goals/goal-insights"
import { getGoals, createGoal, deleteGoal, updateGoal, type Goal as BackendGoal } from "@/lib/api/goals"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

// Updated Goal interface to match what components expect
interface Goal {
  id: string
  name: string
  icon: string
  color: string
  category: string
  targetAmount: number
  savedAmount: number
  targetDate: Date
  createdAt: Date
  contributions: { date: Date; amount: number }[]
}

// Category mapping for icons and colors since backend doesn't store them
const CATEGORY_MAP: Record<string, { icon: string, color: string }> = {
  "Car": { icon: "🚗", color: "#10b981" },
  "Home": { icon: "🏠", color: "#3b82f6" },
  "Travel": { icon: "✈️", color: "#8b5cf6" },
  "Electronics": { icon: "💻", color: "#f59e0b" },
  "Education": { icon: "🎓", color: "#ef4444" },
  "Gift": { icon: "🎁", color: "#ec4899" },
  "Jewelry": { icon: "💎", color: "#06b6d4" },
  "Fitness": { icon: "🏋️", color: "#84cc16" },
}

const DEFAULT_STYLE = { icon: "🎯", color: "#3b82f6" }

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const mapBackendGoal = useCallback((bg: BackendGoal): Goal => {
    const style = CATEGORY_MAP[bg.category || ""] || DEFAULT_STYLE
    return {
      id: bg.id,
      name: bg.title,
      icon: style.icon,
      color: style.color,
      category: bg.category || "Other",
      targetAmount: bg.targetAmount,
      savedAmount: bg.currentAmount,
      targetDate: new Date(bg.deadline),
      createdAt: new Date(bg.createdAt),
      contributions: [], // Backend doesn't return full contribution history in list yet
    }
  }, [])

  const fetchGoals = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getGoals()
      const data = response?.data ?? []
      setGoals(data.map(mapBackendGoal))
    } catch (error) {
      setGoals([])
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load goals",
      })
    } finally {
      setIsLoading(false)
    }
  }, [mapBackendGoal, toast])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const handleAddGoal = async (newGoal: {
    name: string
    targetAmount: number
    duration: number
    durationType: "months" | "years"
    icon: string
    color: string
    category: string
  }) => {
    const deadline = new Date()
    if (newGoal.durationType === "months") {
      deadline.setMonth(deadline.getMonth() + newGoal.duration)
    } else {
      deadline.setFullYear(deadline.getFullYear() + newGoal.duration)
    }

    try {
      const { data } = await createGoal({
        title: newGoal.name,
        targetAmount: newGoal.targetAmount,
        deadline: deadline.toISOString(),
        category: newGoal.category,
      })

      setGoals(prev => [...prev, mapBackendGoal(data)])
      toast({
        title: "Success",
        description: "Goal created successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create goal",
      })
    }
  }

  const handleAddMoney = async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    try {
      const { data } = await updateGoal(goalId, {
        currentAmount: goal.savedAmount + amount
      })

      setGoals(prev => prev.map(g => g.id === goalId ? mapBackendGoal(data) : g))
      toast({
        title: "Success",
        description: `Added ₹${amount.toLocaleString()} to ${goal.name}`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update goal",
      })
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId)
      setGoals(prev => prev.filter((g) => g.id !== goalId))
      toast({
        title: "Deleted",
        description: "Goal removed successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete goal",
      })
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your goals...</p>
      </div>
    )
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

