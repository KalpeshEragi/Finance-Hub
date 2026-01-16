"use client"

import { useEffect, useState } from "react"
import { SubscriptionsOverview } from "@/components/recurrings/subscriptions-overview"
import { SubscriptionsGrid } from "@/components/recurrings/subscriptions-grid"
import { UpcomingRenewals } from "@/components/recurrings/upcoming-renewals"
import { SpendingByCategory } from "@/components/recurrings/spending-by-category"
import { CalendarView } from "@/components/recurrings/calendar-view"
import { getRecurrings, type RecurringSubscription } from "@/lib/api/recurrings"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function RecurringsPage() {
  const [subscriptions, setSubscriptions] = useState<RecurringSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecurrings()
  }, [])

  const fetchRecurrings = async () => {
    setIsLoading(true)
    try {
      const result = await getRecurrings()
      if (result.success) {
        setSubscriptions(result.data)
      }
    } catch (error: any) {
      toast({
        title: "Error fetching subscriptions",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const monthlyTotal = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      if (s.frequency === 'monthly') return sum + s.amount;
      if (s.frequency === 'yearly') return sum + (s.amount / 12);
      if (s.frequency === 'weekly') return sum + (s.amount * 4.33);
      return sum;
    }, 0);

  const topCategory = subscriptions.length > 0 ?
    Object.entries(subscriptions.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + s.amount;
      return acc;
    }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0] : null;

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recurring Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Track your monthly subscriptions and never miss a renewal</p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>

      {/* Stats Overview */}
      <SubscriptionsOverview subscriptions={subscriptions} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Left: Upcoming Renewals */}
        <div className="lg:col-span-2">
          <UpcomingRenewals subscriptions={subscriptions} />
        </div>

        {/* Right: Calendar View */}
        <div>
          <CalendarView />
        </div>
      </div>

      {/* Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-1">
          <SpendingByCategory subscriptions={subscriptions} />
        </div>
        <div className="lg:col-span-2 flex items-center justify-center">
          <div className="text-center p-8 bg-card border border-border rounded-xl w-full">
            <p className="text-4xl mb-3">💡</p>
            <h3 className="text-lg font-medium text-foreground mb-2">Subscription Insights</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {subscriptions.length > 0 ? (
                <>
                  You spend ₹{Math.round(monthlyTotal).toLocaleString("en-IN")}/month on subscriptions.
                  {topCategory && (
                    <> Consider reviewing {topCategory[0]} subscriptions which account for
                      {Math.round((topCategory[1] / subscriptions.reduce((sum, s) => sum + s.amount, 0)) * 100)}% of your recurring expenses.</>
                  )}
                </>
              ) : (
                "Add your subscriptions to get personalized insights and renewal reminders."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* All Subscriptions Grid */}
      <SubscriptionsGrid
        subscriptions={subscriptions}
        isLoading={isLoading}
        onAddClick={() => {
          // Future: Modal to add subscription
          toast({
            title: "Coming Soon",
            description: "Add subscription modal is being implemented.",
          })
        }}
      />
    </>
  )
}
