"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ChevronRight, AlertTriangle } from "lucide-react"
import { type RecurringSubscription } from "@/lib/api/recurrings"

interface UpcomingRenewalsProps {
  subscriptions: RecurringSubscription[]
}

// Map categories to icons
const CATEGORY_ICONS: Record<string, string> = {
  'Entertainment': '🎬',
  'Music': '🎵',
  'Shopping': '📦',
  'Health & Fitness': '💪',
  'Utilities': '📶',
  'Food & Delivery': '🍔',
  'Productivity': '📝',
  'Finance': '📈',
  'Cloud Storage': '☁️',
  'Default': '💳'
};

export function UpcomingRenewals({ subscriptions }: UpcomingRenewalsProps) {
  const today = new Date();

  const upcomingRenewals = subscriptions
    .filter(s => s.status === 'active')
    .map(s => {
      const nextDate = new Date(s.nextBillingDate);
      const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...s,
        daysLeft,
        urgent: daysLeft <= 3,
        icon: CATEGORY_ICONS[s.category] || CATEGORY_ICONS['Default'],
        formattedDate: nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      };
    })
    .filter(s => s.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);

  const totalDue = upcomingRenewals.reduce((sum, item) => sum + item.amount, 0)
  const urgentCount = upcomingRenewals.filter((r) => r.urgent).length

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg text-foreground">Upcoming Renewals</CardTitle>
          </div>
          <button className="flex items-center text-xs text-primary hover:underline">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Total for next {upcomingRenewals.length} items: <span className="text-foreground font-medium">₹{totalDue.toLocaleString("en-IN")}</span>
          </p>
          {urgentCount > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {urgentCount} due soon
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {upcomingRenewals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No upcoming renewals</p>
            </div>
          ) : (
            upcomingRenewals.map((renewal) => (
              <div
                key={renewal.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-secondary/50 ${renewal.urgent ? "bg-red-500/5 border border-red-500/20" : "bg-secondary/30"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
                    {renewal.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{renewal.name}</p>
                    <p className="text-xs text-muted-foreground">{renewal.formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">₹{renewal.amount.toLocaleString("en-IN")}</p>
                    <p
                      className={`text-xs ${renewal.daysLeft <= 3
                          ? "text-red-400"
                          : renewal.daysLeft <= 7
                            ? "text-amber-400"
                            : "text-muted-foreground"
                        }`}
                    >
                      {renewal.daysLeft === 0 ? 'Today' : renewal.daysLeft === 1 ? "Tomorrow" : `${renewal.daysLeft} days left`}
                    </p>
                  </div>

                  {/* Countdown indicator */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${renewal.daysLeft <= 3
                        ? "bg-red-500/20 text-red-400"
                        : renewal.daysLeft <= 7
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                  >
                    {renewal.daysLeft}d
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
