"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface MutualFund {
  name: string
  category: string
  nav: number
  change: number
  investedValue: number
  currentValue: number
  returns: number
  rating: number
}

const mutualFunds: MutualFund[] = [
  {
    name: "Axis Bluechip Fund",
    category: "Large Cap",
    nav: 52.34,
    change: 0.85,
    investedValue: 100000,
    currentValue: 118500,
    returns: 18.5,
    rating: 5,
  },
  {
    name: "Mirae Asset Emerging Bluechip",
    category: "Large & Mid Cap",
    nav: 98.76,
    change: 1.23,
    investedValue: 80000,
    currentValue: 96800,
    returns: 21.0,
    rating: 5,
  },
  {
    name: "Parag Parikh Flexi Cap",
    category: "Flexi Cap",
    nav: 67.45,
    change: -0.45,
    investedValue: 75000,
    currentValue: 84750,
    returns: 13.0,
    rating: 4,
  },
  {
    name: "SBI Small Cap Fund",
    category: "Small Cap",
    nav: 142.18,
    change: 2.15,
    investedValue: 65000,
    currentValue: 81250,
    returns: 25.0,
    rating: 4,
  },
]

export function MutualFundsCard() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Mutual Funds</CardTitle>
        <button className="flex items-center text-xs text-primary hover:underline">
          Explore Funds <ChevronRight className="w-3 h-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mutualFunds.map((fund) => {
            const isPositive = fund.change >= 0
            return (
              <div
                key={fund.name}
                className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{fund.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{fund.category}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3 h-3",
                              i < fund.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      isPositive ? "text-emerald-400" : "text-red-400",
                    )}
                  >
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? "+" : ""}
                    {fund.change.toFixed(2)}%
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-muted-foreground">Invested</p>
                    <p className="text-foreground font-medium">₹{fund.investedValue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Current</p>
                    <p className="text-foreground font-medium">₹{fund.currentValue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Returns</p>
                    <p className="text-emerald-400 font-medium">+{fund.returns}%</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
