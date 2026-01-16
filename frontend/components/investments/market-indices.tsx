"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

const indices = [
  { name: "NIFTY 50", value: 22450.75, change: 125.3, changePercent: 0.56 },
  { name: "SENSEX", value: 73852.94, change: 412.85, changePercent: 0.56 },
  { name: "NIFTY BANK", value: 48125.6, change: -185.4, changePercent: -0.38 },
  { name: "NIFTY IT", value: 38450.2, change: 245.6, changePercent: 0.64 },
]

export function MarketIndices() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
      {indices.map((index) => {
        const isPositive = index.change >= 0
        return (
          <Card key={index.name} className="bg-card border-border min-w-[180px] flex-shrink-0">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{index.name}</p>
              <p className="text-lg font-semibold text-foreground">{index.value.toLocaleString()}</p>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium mt-1",
                  isPositive ? "text-emerald-400" : "text-red-400",
                )}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}
                {index.change.toFixed(2)} ({isPositive ? "+" : ""}
                {index.changePercent.toFixed(2)}%)
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
