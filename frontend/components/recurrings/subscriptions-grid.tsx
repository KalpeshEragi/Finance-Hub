"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SubscriptionCard } from "./subscription-card"
import { Search, Plus, Filter, SlidersHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

const subscriptions = [
  {
    id: "1",
    name: "Netflix",
    icon: "🎬",
    category: "Entertainment",
    amount: 649,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 0, 18),
    color: "#E50914",
    isActive: true,
    reminder: true,
  },
  {
    id: "2",
    name: "Spotify Premium",
    icon: "🎵",
    category: "Entertainment",
    amount: 119,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 0, 22),
    color: "#1DB954",
    isActive: true,
    reminder: true,
  },
  {
    id: "3",
    name: "Amazon Prime",
    icon: "📦",
    category: "Shopping",
    amount: 1499,
    billingCycle: "yearly" as const,
    nextBillingDate: new Date(2026, 3, 15),
    color: "#FF9900",
    isActive: true,
    reminder: false,
  },
  {
    id: "4",
    name: "Gym Membership",
    icon: "💪",
    category: "Health & Fitness",
    amount: 2500,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 0, 20),
    color: "#FF5722",
    isActive: true,
    reminder: true,
  },
  {
    id: "5",
    name: "Jio Fiber",
    icon: "📶",
    category: "Utilities",
    amount: 1199,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 0, 25),
    color: "#0A2351",
    isActive: true,
    reminder: true,
  },
  {
    id: "6",
    name: "Disney+ Hotstar",
    icon: "✨",
    category: "Entertainment",
    amount: 299,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 0, 28),
    color: "#1A73E8",
    isActive: true,
    reminder: false,
  },
  {
    id: "7",
    name: "YouTube Premium",
    icon: "▶️",
    category: "Entertainment",
    amount: 129,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 1, 3),
    color: "#FF0000",
    isActive: true,
    reminder: false,
  },
  {
    id: "8",
    name: "iCloud Storage",
    icon: "☁️",
    category: "Cloud Storage",
    amount: 75,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 0, 17),
    color: "#007AFF",
    isActive: true,
    reminder: true,
  },
  {
    id: "9",
    name: "Notion Pro",
    icon: "📝",
    category: "Productivity",
    amount: 800,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 1, 8),
    color: "#000000",
    isActive: false,
    reminder: false,
  },
  {
    id: "10",
    name: "Swiggy One",
    icon: "🍔",
    category: "Food & Delivery",
    amount: 149,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 0, 30),
    color: "#FC8019",
    isActive: true,
    reminder: false,
  },
  {
    id: "11",
    name: "Zerodha",
    icon: "📈",
    category: "Finance",
    amount: 200,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 1, 1),
    color: "#387ED1",
    isActive: true,
    reminder: true,
  },
  {
    id: "12",
    name: "Electricity Bill",
    icon: "⚡",
    category: "Utilities",
    amount: 1800,
    billingCycle: "monthly" as const,
    nextBillingDate: new Date(2026, 0, 19),
    color: "#FFC107",
    isActive: true,
    reminder: true,
  },
]

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

export function SubscriptionsGrid() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState<"name" | "amount" | "dueDate">("dueDate")

  const filteredSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || sub.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "amount") return b.amount - a.amount
      return a.nextBillingDate.getTime() - b.nextBillingDate.getTime()
    })

  const activeCount = subscriptions.filter((s) => s.isActive).length
  const pausedCount = subscriptions.filter((s) => !s.isActive).length

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
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
              className={`cursor-pointer transition-colors ${
                selectedCategory === category ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {filteredSubscriptions.length === 0 ? (
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
