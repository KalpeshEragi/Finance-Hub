"use client"

import { useState } from "react"
import { GoalCard } from "./goal-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal } from "lucide-react"

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

interface GoalsGridProps {
  goals: Goal[]
  onAddMoney: (goalId: string, amount: number) => void
  onDelete: (goalId: string) => void
}

export function GoalsGrid({ goals, onAddMoney, onDelete }: GoalsGridProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("deadline")
  const [filterCategory, setFilterCategory] = useState("all")

  const categories = ["all", ...new Set(goals.map((g) => g.category))]

  const filteredGoals = goals
    .filter((goal) => {
      const matchesSearch = goal.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === "all" || goal.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return a.targetDate.getTime() - b.targetDate.getTime()
        case "progress":
          return b.savedAmount / b.targetAmount - a.savedAmount / a.targetAmount
        case "amount":
          return b.targetAmount - a.targetAmount
        case "recent":
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground"
          />
        </div>
        <div className="flex gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 bg-secondary border-border text-foreground">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onAddMoney={onAddMoney} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🎯</p>
          <h3 className="text-lg font-medium text-foreground mb-2">No goals found</h3>
          <p className="text-sm text-muted-foreground">
            {search || filterCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first savings goal to get started!"}
          </p>
        </div>
      )}
    </div>
  )
}
