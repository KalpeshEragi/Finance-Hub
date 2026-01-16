"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface Holding {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  investedValue: number
  currentValue: number
  gainLoss: number
  gainLossPercent: number
}

const holdings: Holding[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd.",
    quantity: 50,
    avgPrice: 2400,
    currentPrice: 2610,
    investedValue: 120000,
    currentValue: 130500,
    gainLoss: 10500,
    gainLossPercent: 8.75,
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    quantity: 30,
    avgPrice: 3100,
    currentPrice: 3340,
    investedValue: 93000,
    currentValue: 100200,
    gainLoss: 7200,
    gainLossPercent: 7.74,
  },
  {
    symbol: "INFY",
    name: "Infosys Ltd.",
    quantity: 75,
    avgPrice: 1600,
    currentPrice: 1510,
    investedValue: 120000,
    currentValue: 113250,
    gainLoss: -6750,
    gainLossPercent: -5.63,
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd.",
    quantity: 60,
    avgPrice: 1580,
    currentPrice: 1680,
    investedValue: 94800,
    currentValue: 100800,
    gainLoss: 6000,
    gainLossPercent: 6.33,
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors Ltd.",
    quantity: 100,
    avgPrice: 650,
    currentPrice: 785,
    investedValue: 65000,
    currentValue: 78500,
    gainLoss: 13500,
    gainLossPercent: 20.77,
  },
  {
    symbol: "WIPRO",
    name: "Wipro Ltd.",
    quantity: 80,
    avgPrice: 460,
    currentPrice: 420,
    investedValue: 36800,
    currentValue: 33600,
    gainLoss: -3200,
    gainLossPercent: -8.7,
  },
]

export function HoldingsList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredHoldings = holdings.filter(
    (h) =>
      h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Your Holdings</CardTitle>
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stocks..."
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
            <div className="col-span-3">Stock</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Avg Price</div>
            <div className="col-span-2 text-right">Current</div>
            <div className="col-span-3 text-right">P&L</div>
          </div>

          {/* Holdings */}
          {filteredHoldings.map((holding) => {
            const isPositive = holding.gainLoss >= 0
            return (
              <div
                key={holding.symbol}
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
                  <p className="text-sm text-foreground">₹{holding.avgPrice.toLocaleString()}</p>
                </div>
                <div className="col-span-2 text-right self-center">
                  <p className="text-sm text-foreground">₹{holding.currentPrice.toLocaleString()}</p>
                </div>
                <div className="col-span-3 text-right self-center">
                  <div className="flex items-center justify-end gap-1">
                    <div>
                      <p className={cn("text-sm font-medium", isPositive ? "text-emerald-400" : "text-red-400")}>
                        {isPositive ? "+" : ""}₹{holding.gainLoss.toLocaleString()}
                      </p>
                      <p className={cn("text-xs", isPositive ? "text-emerald-400" : "text-red-400")}>
                        {isPositive ? "+" : ""}
                        {holding.gainLossPercent.toFixed(2)}%
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
          })}
        </div>

        <button className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-primary hover:underline">
          View All Holdings <ChevronRight className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  )
}
