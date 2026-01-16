"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

export function SubscriptionsOverview() {
  const stats = [
    {
      label: "Monthly Total",
      value: "₹8,416",
      change: "+₹649",
      trend: "up",
      description: "vs last month",
    },
    {
      label: "Active Subscriptions",
      value: "12",
      change: "+2",
      trend: "up",
      description: "new this month",
    },
    {
      label: "Due This Week",
      value: "4",
      change: "₹3,467",
      trend: "neutral",
      description: "total amount",
    },
    {
      label: "Yearly Estimate",
      value: "₹1,00,992",
      change: "-₹4,800",
      trend: "down",
      description: "vs last year",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              {stat.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : stat.trend === "down" ? (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              ) : (
                <Calendar className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`text-xs ${
                  stat.trend === "up" ? "text-red-400" : stat.trend === "down" ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground">{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
