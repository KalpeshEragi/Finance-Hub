"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ChevronRight, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { type InvestmentHolding } from "@/lib/api/investments"

interface HoldingsListProps {
  holdings: InvestmentHolding[]
  isLoading?: boolean
}

export function HoldingsList({ holdings, isLoading }: HoldingsListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredHoldings = holdings.filter(
    (h) =>
      h.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Your Holdings</CardTitle>
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 bg-secondary border-border text-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground border-b border-border">
            <div className="col-span-3">Asset</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Avg Price</div>
            <div className="col-span-2 text-right">Current</div>
            <div className="col-span-3 text-right">P&L</div>
          </div>

          {/* Holdings */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredHoldings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No holdings found
            </div>
          ) : (
            filteredHoldings.map((holding) => {
              const investedValue = holding.quantity * holding.averagePrice;
              const currentValue = holding.quantity * holding.currentPrice;
              const gainLoss = currentValue - investedValue;
              const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;
              const isPositive = gainLoss >= 0;

              return (
                <div
                  key={holding.id}
                  className="grid grid-cols-12 gap-2 px-3 py-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                >
                  <div className="col-span-3">
                    <p className="font-medium text-foreground text-sm">{holding.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{holding.name}</p>
                  </div>
                  <div className="col-span-2 text-right self-center">
                    <p className="text-sm text-foreground">{holding.quantity}</p>
                  </div>
                  <div className="col-span-2 text-right self-center">
                    <p className="text-sm text-foreground">₹{holding.averagePrice.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 text-right self-center">
                    <p className="text-sm text-foreground">₹{holding.currentPrice.toLocaleString()}</p>
                  </div>
                  <div className="col-span-3 text-right self-center">
                    <div className="flex items-center justify-end gap-1">
                      <div>
                        <p className={cn("text-sm font-medium", isPositive ? "text-emerald-400" : "text-red-400")}>
                          {isPositive ? "+" : ""}₹{Math.abs(gainLoss).toLocaleString()}
                        </p>
                        <p className={cn("text-xs", isPositive ? "text-emerald-400" : "text-red-400")}>
                          {isPositive ? "+" : ""}
                          {gainLossPercent.toFixed(2)}%
                        </p>
                      </div>
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <button className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-primary hover:underline">
          View All Holdings <ChevronRight className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  )
}
