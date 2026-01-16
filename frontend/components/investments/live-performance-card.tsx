"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface Investment {
  symbol: string
  name: string
  change: number
  data: { value: number }[]
}

const investments: Investment[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    change: 2.34,
    data: [
      { value: 2450 },
      { value: 2480 },
      { value: 2465 },
      { value: 2510 },
      { value: 2495 },
      { value: 2530 },
      { value: 2520 },
      { value: 2555 },
      { value: 2540 },
      { value: 2580 },
      { value: 2565 },
      { value: 2610 },
    ],
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy",
    change: 1.87,
    data: [
      { value: 3200 },
      { value: 3180 },
      { value: 3220 },
      { value: 3250 },
      { value: 3235 },
      { value: 3270 },
      { value: 3255 },
      { value: 3290 },
      { value: 3275 },
      { value: 3310 },
      { value: 3295 },
      { value: 3340 },
    ],
  },
  {
    symbol: "INFY",
    name: "Infosys",
    change: -1.23,
    data: [
      { value: 1580 },
      { value: 1560 },
      { value: 1575 },
      { value: 1550 },
      { value: 1565 },
      { value: 1540 },
      { value: 1555 },
      { value: 1530 },
      { value: 1545 },
      { value: 1520 },
      { value: 1535 },
      { value: 1510 },
    ],
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    change: 0.95,
    data: [
      { value: 1620 },
      { value: 1615 },
      { value: 1630 },
      { value: 1640 },
      { value: 1635 },
      { value: 1650 },
      { value: 1645 },
      { value: 1660 },
      { value: 1655 },
      { value: 1670 },
      { value: 1665 },
      { value: 1680 },
    ],
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    change: 1.56,
    data: [
      { value: 980 },
      { value: 985 },
      { value: 990 },
      { value: 1000 },
      { value: 995 },
      { value: 1010 },
      { value: 1005 },
      { value: 1020 },
      { value: 1015 },
      { value: 1030 },
      { value: 1025 },
      { value: 1040 },
    ],
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    change: -0.78,
    data: [
      { value: 620 },
      { value: 615 },
      { value: 625 },
      { value: 610 },
      { value: 620 },
      { value: 608 },
      { value: 615 },
      { value: 605 },
      { value: 612 },
      { value: 600 },
      { value: 608 },
      { value: 595 },
    ],
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors",
    change: 3.12,
    data: [
      { value: 680 },
      { value: 695 },
      { value: 710 },
      { value: 725 },
      { value: 715 },
      { value: 740 },
      { value: 730 },
      { value: 755 },
      { value: 745 },
      { value: 770 },
      { value: 760 },
      { value: 785 },
    ],
  },
  {
    symbol: "WIPRO",
    name: "Wipro",
    change: -2.15,
    data: [
      { value: 480 },
      { value: 470 },
      { value: 475 },
      { value: 460 },
      { value: 465 },
      { value: 450 },
      { value: 455 },
      { value: 440 },
      { value: 445 },
      { value: 430 },
      { value: 435 },
      { value: 420 },
    ],
  },
]

function InvestmentCard({ investment }: { investment: Investment }) {
  const isPositive = investment.change >= 0
  const chartColor = isPositive ? "#10b981" : "#ef4444"
  const gradientId = `gradient-${investment.symbol}`

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-foreground text-sm">{investment.symbol}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[100px]">{investment.name}</p>
          </div>
        </div>

        <div className="h-[60px] my-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={investment.data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fill={`url(#${gradientId})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400",
          )}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}
          {investment.change.toFixed(2)}%
        </div>
      </CardContent>
    </Card>
  )
}

export function LivePerformanceCard() {
  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">Live Performance</h2>
        <p className="text-sm text-muted-foreground">Live estimates. Check when you want to, not when you have to.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        {investments.map((investment) => (
          <InvestmentCard key={investment.symbol} investment={investment} />
        ))}
      </div>
    </div>
  )
}
