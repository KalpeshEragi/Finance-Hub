"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

const timeRanges = ["1W", "1M", "3M", "YTD", "1Y", "ALL"]

export function NetWorthCard() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net worth</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Assets
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Debts
            </span>
          </div>
        </div>
        <button className="flex items-center text-xs text-primary hover:underline">
          Accounts <ChevronRight className="w-3 h-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-8 mb-4">
          <div>
            <p className="text-3xl font-bold text-foreground">₹12,50,000</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              ↑ 32% <span className="text-muted-foreground">from last month</span>
            </p>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">₹2,50,000</p>
            <p className="text-xs text-red-400 flex items-center gap-1">
              ↓ 18% <span className="text-muted-foreground">debt reduction</span>
            </p>
          </div>
        </div>

        <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-4">
          <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: "83%" }} />
        </div>

        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              className={`px-2 py-1 text-xs rounded ${
                range === "YTD" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
