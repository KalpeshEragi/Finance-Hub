"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Bell, BellOff, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface SubscriptionCardProps {
  subscription: {
    id: string
    name: string
    icon: string
    category: string
    amount: number
    billingCycle: "monthly" | "yearly" | "weekly"
    nextBillingDate: Date
    color: string
    isActive: boolean
    reminder: boolean
  }
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const today = new Date()
  const daysUntilRenewal = Math.ceil((subscription.nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return "bg-red-500/20 text-red-400 border-red-500/30"
    if (days <= 7) return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  }

  const getProgressWidth = (days: number) => {
    const maxDays = subscription.billingCycle === "monthly" ? 30 : subscription.billingCycle === "yearly" ? 365 : 7
    const progress = ((maxDays - days) / maxDays) * 100
    return Math.min(progress, 100)
  }

  const getProgressColor = (days: number) => {
    if (days <= 3) return "bg-red-500"
    if (days <= 7) return "bg-amber-500"
    return "bg-emerald-500"
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <Card
      className={cn(
        "bg-card border-border hover:border-primary/30 transition-all duration-200 group",
        !subscription.isActive && "opacity-60",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: subscription.color + "20" }}
            >
              {subscription.icon}
            </div>
            <div>
              <h3 className="font-medium text-foreground flex items-center gap-2">
                {subscription.name}
                {!subscription.isActive && (
                  <Badge variant="outline" className="text-xs bg-muted">
                    Paused
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">{subscription.category}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit subscription</DropdownMenuItem>
              <DropdownMenuItem>View history</DropdownMenuItem>
              <DropdownMenuItem>{subscription.isActive ? "Pause" : "Resume"}</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Cancel subscription</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-semibold text-foreground">₹{subscription.amount.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground capitalize">/{subscription.billingCycle}</p>
          </div>

          <div className={cn("px-3 py-1.5 rounded-lg border text-sm font-medium", getUrgencyColor(daysUntilRenewal))}>
            {daysUntilRenewal === 0 ? (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Due today
              </span>
            ) : daysUntilRenewal === 1 ? (
              "1 day left"
            ) : (
              `${daysUntilRenewal} days left`
            )}
          </div>
        </div>

        {/* Progress bar showing billing cycle progress */}
        <div className="mb-3">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getProgressColor(daysUntilRenewal))}
              style={{ width: `${getProgressWidth(daysUntilRenewal)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Next billing: {formatDate(subscription.nextBillingDate)}</span>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            {subscription.reminder ? (
              <>
                <Bell className="w-3 h-3 text-primary" />
                <span className="text-primary">Reminder on</span>
              </>
            ) : (
              <>
                <BellOff className="w-3 h-3" />
                <span>Set reminder</span>
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
