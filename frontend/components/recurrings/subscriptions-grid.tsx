"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SubscriptionCard } from "./subscription-card"
import { Search, Plus, Filter, SlidersHorizontal, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { type RecurringSubscription } from "@/lib/api/recurrings"

interface SubscriptionsGridProps {
  subscriptions: RecurringSubscription[]
  isLoading?: boolean
  onAddClick?: () => void
}

const categories = [
  "All",
  "Entertainment",
  "Utilities",
  "Health & Fitness",
  "Shopping",
  "Productivity",
  "Finance",
  "Food & Delivery",
  "Cloud Storage",
]

export function SubscriptionsGrid({ subscriptions, isLoading, onAddClick }: SubscriptionsGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState<"name" | "amount" | "dueDate">("dueDate")

  const filteredSubscriptions = (subscriptions || [])
    .filter((sub) => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || sub.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "amount") return b.amount - a.amount
      return new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime()
    })

  const activeCount = (subscriptions || []).filter((s) => s.status === 'active').length
  const pausedCount = (subscriptions || []).filter((s) => s.status !== 'active').length

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-foreground">Your Subscriptions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCount} active, {pausedCount} paused
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-border bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  {selectedCategory === "All" ? "Category" : selectedCategory}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-secondary" : ""}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-border bg-transparent">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSortBy("dueDate")}
                  className={sortBy === "dueDate" ? "bg-secondary" : ""}
                >
                  Due date (soonest first)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("amount")}
                  className={sortBy === "amount" ? "bg-secondary" : ""}
                >
                  Amount (highest first)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")} className={sortBy === "name" ? "bg-secondary" : ""}>
                  Name (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.slice(0, 6).map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${selectedCategory === category ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No subscriptions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id} subscription={subscription} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
