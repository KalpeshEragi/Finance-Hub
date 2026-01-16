"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { type InvestmentHolding } from "@/lib/api/investments"

interface MutualFundsCardProps {
  holdings: InvestmentHolding[]
}

export function MutualFundsCard({ holdings }: MutualFundsCardProps) {
  const mutualFunds = holdings.filter(h => h.type === 'mutual_fund');

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
          {mutualFunds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No mutual funds in portfolio
            </div>
          ) : (
            mutualFunds.map((fund) => {
              const investedValue = fund.quantity * fund.averagePrice;
              const currentValue = fund.quantity * fund.currentPrice;
              const returns = investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0;
              const isPositive = returns >= 0;

              return (
                <div
                  key={fund.id}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{fund.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{fund.symbol}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3 h-3",
                                i < 4 ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30",
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
                      {returns.toFixed(2)}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-muted-foreground">Invested</p>
                      <p className="text-foreground font-medium">₹{investedValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Current</p>
                      <p className="text-foreground font-medium">₹{currentValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">NAV (Price)</p>
                      <p className="text-foreground font-medium">₹{fund.currentPrice.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
