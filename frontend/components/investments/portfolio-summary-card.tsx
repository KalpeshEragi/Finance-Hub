"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Wallet } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const portfolioData = [
  { name: "Stocks", value: 450000, color: "#10b981" },
  { name: "Mutual Funds", value: 320000, color: "#6366f1" },
  { name: "Fixed Deposits", value: 200000, color: "#f59e0b" },
  { name: "Gold", value: 130000, color: "#eab308" },
]

const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0)
const totalGain = 125000
const totalGainPercent = 12.8

export function PortfolioSummaryCard() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Portfolio Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-[140px] h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1">
            <p className="text-3xl font-bold text-foreground">₹{totalValue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mb-3">Total Invested</p>

            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-sm font-medium text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              +₹{totalGain.toLocaleString()} ({totalGainPercent}%)
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
          {portfolioData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className="text-sm font-medium text-foreground">₹{item.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
