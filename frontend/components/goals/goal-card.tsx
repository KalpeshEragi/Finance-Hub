"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal, Plus, Calendar, TrendingUp, Target, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface GoalCardProps {
  goal: Goal
  onAddMoney: (goalId: string, amount: number) => void
  onDelete: (goalId: string) => void
}

export function GoalCard({ goal, onAddMoney, onDelete }: GoalCardProps) {
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [addAmount, setAddAmount] = useState("")

  const progress = (goal.savedAmount / goal.targetAmount) * 100
  const remainingAmount = goal.targetAmount - goal.savedAmount
  const isCompleted = progress >= 100

  // Calculate days remaining
  const today = new Date()
  const daysRemaining = Math.ceil((goal.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const monthsRemaining = Math.ceil(daysRemaining / 30)

  // Calculate required monthly saving
  const monthlyRequired = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount

  // Determine status
  const getStatus = () => {
    if (isCompleted) return { label: "Completed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
    if (daysRemaining < 0) return { label: "Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30" }
    if (daysRemaining <= 30) return { label: "Due Soon", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
    return { label: "On Track", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
  }

  const status = getStatus()

  const handleAddMoney = () => {
    if (addAmount && Number.parseFloat(addAmount) > 0) {
      onAddMoney(goal.id, Number.parseFloat(addAmount))
      setAddAmount("")
      setShowAddMoney(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const quickAmounts = [1000, 2000, 5000, 10000]

  return (
    <>
      <Card
        className={cn(
          "bg-card border-border hover:border-primary/30 transition-all duration-200 group overflow-hidden",
          isCompleted && "ring-2 ring-emerald-500/30",
        )}
      >
        {/* Colored top bar */}
        <div className="h-1.5" style={{ backgroundColor: goal.color }} />

        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: goal.color + "20" }}
              >
                {isCompleted ? <Check className="w-7 h-7 text-emerald-400" /> : goal.icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">{goal.name}</h3>
                <p className="text-xs text-muted-foreground">{goal.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs border", status.color)}>
                {status.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem>Edit goal</DropdownMenuItem>
                  <DropdownMenuItem>View history</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(goal.id)}>
                    Delete goal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Saved</p>
                <p className="text-2xl font-bold text-foreground">₹{goal.savedAmount.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-lg text-muted-foreground">₹{goal.targetAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: goal.color,
                }}
              />
              {isCompleted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-muted-foreground">{progress.toFixed(1)}% complete</p>
              <p className="text-xs text-muted-foreground">₹{remainingAmount.toLocaleString("en-IN")} remaining</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="text-sm font-medium text-foreground">{formatDate(goal.targetDate)}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Target className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Days Left</p>
              <p
                className={cn(
                  "text-sm font-medium",
                  daysRemaining < 0 ? "text-red-400" : daysRemaining <= 30 ? "text-amber-400" : "text-foreground",
                )}
              >
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} overdue` : daysRemaining}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Monthly Need</p>
              <p className="text-sm font-medium text-foreground">
                ₹{Math.ceil(monthlyRequired).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Add Money Button */}
          {!isCompleted && (
            <Button
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              onClick={() => setShowAddMoney(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
          )}

          {isCompleted && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
              <p className="text-emerald-400 font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Goal Achieved! Congratulations!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <span className="text-2xl">{goal.icon}</span>
              Add Money to {goal.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ₹{remainingAmount.toLocaleString("en-IN")} more needed to reach your goal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className={cn("border-border", addAmount === amount.toString() && "bg-primary/20 border-primary")}
                  onClick={() => setAddAmount(amount.toString())}
                >
                  ₹{amount.toLocaleString("en-IN")}
                </Button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Or enter custom amount</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="bg-secondary border-border text-foreground text-lg"
              />
            </div>

            {/* New Progress Preview */}
            {addAmount && Number.parseFloat(addAmount) > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                <p className="text-sm text-muted-foreground mb-2">After this contribution:</p>
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-medium">
                    ₹{(goal.savedAmount + Number.parseFloat(addAmount)).toLocaleString("en-IN")}
                  </span>
                  <span className="text-primary font-medium">
                    {Math.min(
                      ((goal.savedAmount + Number.parseFloat(addAmount)) / goal.targetAmount) * 100,
                      100,
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(((goal.savedAmount + Number.parseFloat(addAmount)) / goal.targetAmount) * 100, 100)}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-border bg-transparent"
                onClick={() => setShowAddMoney(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleAddMoney}
                disabled={!addAmount || Number.parseFloat(addAmount) <= 0}
              >
                Add ₹{addAmount ? Number.parseFloat(addAmount).toLocaleString("en-IN") : "0"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
