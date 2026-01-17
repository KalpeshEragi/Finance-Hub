"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { type RecurringSubscription } from "@/lib/api/recurrings"

interface SubscriptionsOverviewProps {
  subscriptions: RecurringSubscription[]
}

export function SubscriptionsOverview({ subscriptions }: SubscriptionsOverviewProps) {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const monthlyTotal = activeSubs.reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + s.amount;
    if (s.frequency === 'yearly') return sum + (s.amount / 12);
    if (s.frequency === 'weekly') return sum + (s.amount * 4.33);
    return sum;
  }, 0);

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const dueThisWeek = activeSubs.filter(s => {
    const nextDate = new Date(s.nextBillingDate);
    return nextDate >= today && nextDate <= nextWeek;
  });

  const dueThisWeekTotal = dueThisWeek.reduce((sum, s) => sum + s.amount, 0);

  const stats = [
    {
      label: "Monthly Total",
      value: `₹${Math.round(monthlyTotal).toLocaleString("en-IN")}`,
      change: "Predicted",
      trend: "neutral",
      description: "avg per month",
    },
    {
      label: "Active Subscriptions",
      value: activeSubs.length.toString(),
      change: `+${activeSubs.filter(s => {
        const created = new Date(s.nextBillingDate); // Placeholder for actually tracking when added
        return created.getMonth() === today.getMonth();
      }).length}`,
      trend: "up",
      description: "this month",
    },
    {
      label: "Due This Week",
      value: dueThisWeek.length.toString(),
      change: `₹${dueThisWeekTotal.toLocaleString("en-IN")}`,
      trend: "neutral",
      description: "total amount",
    },
    {
      label: "Yearly Estimate",
      value: `₹${Math.round(monthlyTotal * 12).toLocaleString("en-IN")}`,
      change: "Based on current",
      trend: "neutral",
      description: "annual cost",
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
                className={`text-xs ${stat.trend === "up" ? "text-red-400" : stat.trend === "down" ? "text-emerald-400" : "text-amber-400"
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
