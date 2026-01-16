import { SubscriptionsOverview } from "@/components/recurrings/subscriptions-overview"
import { SubscriptionsGrid } from "@/components/recurrings/subscriptions-grid"
import { UpcomingRenewals } from "@/components/recurrings/upcoming-renewals"
import { SpendingByCategory } from "@/components/recurrings/spending-by-category"
import { CalendarView } from "@/components/recurrings/calendar-view"

export default function RecurringsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Recurring Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Track your monthly subscriptions and never miss a renewal</p>
      </div>

      {/* Stats Overview */}
      <SubscriptionsOverview />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Left: Upcoming Renewals */}
        <div className="lg:col-span-2">
          <UpcomingRenewals />
        </div>

        {/* Right: Calendar View */}
        <div>
          <CalendarView />
        </div>
      </div>

      {/* Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-1">
          <SpendingByCategory />
        </div>
        <div className="lg:col-span-2 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-4xl mb-3">💡</p>
            <h3 className="text-lg font-medium text-foreground mb-2">Subscription Insights</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You spend ₹8,416/month on subscriptions. Consider reviewing Entertainment subscriptions which account for
              14% of your recurring expenses.
            </p>
          </div>
        </div>
      </div>

      {/* All Subscriptions Grid */}
      <SubscriptionsGrid />
    </>
  )
}
