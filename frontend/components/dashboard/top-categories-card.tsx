"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

const categories = [
  { name: "Food & Drink", icon: "🍕", count: 45, spent: "₹12,500", budget: "₹15,000", color: "#ef4444" },
  { name: "Restaurants", icon: "🍽️", count: 28, spent: "₹8,400", budget: "₹10,000", color: "#f97316" },
  { name: "Groceries", icon: "🛒", count: 12, spent: "₹6,200", budget: "₹8,000", color: "#eab308" },
  { name: "Coffee", icon: "☕", count: 21, spent: "₹2,100", budget: "₹2,500", color: "#84cc16" },
  { name: "Necessities", icon: "🏠", count: 8, spent: "₹15,000", budget: "₹20,000", color: "#22c55e" },
  { name: "Shopping", icon: "🛍️", count: 15, spent: "₹9,800", budget: "₹12,000", color: "#14b8a6" },
  { name: "Fun", icon: "🎮", count: 6, spent: "₹4,500", budget: "₹6,000", color: "#3b82f6" },
]

export function TopCategoriesCard() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Top categories</CardTitle>
        <button className="flex items-center text-xs text-primary hover:underline">
          Categories <ChevronRight className="w-3 h-3" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((cat) => {
          const percentage =
            (Number.parseFloat(cat.spent.replace(/[₹,]/g, "")) / Number.parseFloat(cat.budget.replace(/[₹,]/g, ""))) *
            100

          return (
            <div key={cat.name} className="flex items-center gap-3">
              <span className="text-lg">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground truncate">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.count}</span>
                </div>
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-foreground w-20 text-right">{cat.spent}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
