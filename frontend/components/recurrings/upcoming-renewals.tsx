"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ChevronRight, AlertTriangle } from "lucide-react"

const upcomingRenewals = [
  { name: "iCloud Storage", icon: "☁️", date: "Jan 17", daysLeft: 1, amount: 75, urgent: true },
  { name: "Netflix", icon: "🎬", date: "Jan 18", daysLeft: 2, amount: 649, urgent: true },
  { name: "Electricity Bill", icon: "⚡", date: "Jan 19", daysLeft: 3, amount: 1800, urgent: true },
  { name: "Gym Membership", icon: "💪", date: "Jan 20", daysLeft: 4, amount: 2500, urgent: false },
  { name: "Spotify Premium", icon: "🎵", date: "Jan 22", daysLeft: 6, amount: 119, urgent: false },
  { name: "Jio Fiber", icon: "📶", date: "Jan 25", daysLeft: 9, amount: 1199, urgent: false },
]

export function UpcomingRenewals() {
  const totalDue = upcomingRenewals.reduce((sum, item) => sum + item.amount, 0)
  const urgentCount = upcomingRenewals.filter((r) => r.urgent).length

  return (
    <Card className="bg-card border-border">
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
            Total due: <span className="text-foreground font-medium">₹{totalDue.toLocaleString("en-IN")}</span>
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
          {upcomingRenewals.map((renewal, index) => (
            <div
              key={renewal.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-secondary/50 ${
                renewal.urgent ? "bg-red-500/5 border border-red-500/20" : "bg-secondary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
                  {renewal.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{renewal.name}</p>
                  <p className="text-xs text-muted-foreground">{renewal.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">₹{renewal.amount.toLocaleString("en-IN")}</p>
                  <p
                    className={`text-xs ${
                      renewal.daysLeft <= 3
                        ? "text-red-400"
                        : renewal.daysLeft <= 7
                          ? "text-amber-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {renewal.daysLeft === 1 ? "Tomorrow" : `${renewal.daysLeft} days left`}
                  </p>
                </div>

                {/* Countdown indicator */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                    renewal.daysLeft <= 3
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
