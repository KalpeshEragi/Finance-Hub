"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown, Search, Briefcase, Landmark, BarChart3, Coins, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type InvestmentHolding } from "@/lib/api/investments"

interface MutualFundsCardProps {
  holdings: InvestmentHolding[]
}

// Asset type configuration
const ASSET_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  'stock': {
    icon: <BarChart3 className="w-4 h-4" />,
    label: 'Stock',
    color: 'text-emerald-400'
  },
  'mutual_fund': {
    icon: <Briefcase className="w-4 h-4" />,
    label: 'Mutual Fund',
    color: 'text-indigo-400'
  },
  'ppf': {
    icon: <Landmark className="w-4 h-4" />,
    label: 'PPF',
    color: 'text-amber-400'
  },
  'fd': {
    icon: <Building2 className="w-4 h-4" />,
    label: 'FD',
    color: 'text-slate-400'
  },
  'gold': {
    icon: <Coins className="w-4 h-4" />,
    label: 'Gold',
    color: 'text-yellow-400'
  },
  'other': {
    icon: <Briefcase className="w-4 h-4" />,
    label: 'Other',
    color: 'text-gray-400'
  }
}

export function MutualFundsCard({ holdings }: MutualFundsCardProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter assets based on search query
  const filteredAssets = holdings.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Assets
        </CardTitle>

        {/* Search Bar */}
        <div className="relative w-40">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search Assets"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs bg-secondary border-border"
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Scrollable Asset List */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {holdings.length === 0
                ? "No assets added yet"
                : "No assets match your search"
              }
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const investedValue = asset.quantity * asset.averagePrice;
              const currentValue = asset.quantity * asset.currentPrice;
              const returns = investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0;
              const isPositive = returns >= 0;
              const config = ASSET_CONFIG[asset.type] || ASSET_CONFIG['other'];

              return (
                <div
                  key={asset.id}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {/* Asset Type Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center bg-secondary shrink-0",
                        config.color
                      )}>
                        {config.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{asset.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {asset.symbol && (
                            <span className="text-xs text-muted-foreground">{asset.symbol}</span>
                          )}
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", config.color, "bg-secondary")}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Returns Badge */}
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium shrink-0",
                        isPositive ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? "+" : ""}
                      {returns.toFixed(2)}%
                    </div>
                  </div>

                  {/* Asset Details */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-muted-foreground">Qty</p>
                      <p className="text-foreground font-medium">{asset.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Invested</p>
                      <p className="text-foreground font-medium">₹{investedValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Current</p>
                      <p className="text-foreground font-medium">₹{currentValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Asset Count */}
        {holdings.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <span>{filteredAssets.length} of {holdings.length} assets</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
