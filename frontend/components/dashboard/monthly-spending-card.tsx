"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const spendingData = [
  { day: "1", amount: 2000 },
  { day: "5", amount: 4500 },
  { day: "10", amount: 3200 },
  { day: "15", amount: 6800 },
  { day: "20", amount: 5400 },
  { day: "25", amount: 8200 },
  { day: "30", amount: 12500 },
]

export function MonthlySpendingCard() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly spending</CardTitle>
        <button className="flex items-center text-xs text-primary hover:underline">
          Transactions <ChevronRight className="w-3 h-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold text-foreground">₹45,000</p>
          <p className="text-sm text-muted-foreground">₹38,000 spent last month</p>
        </div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendingData}>
              <defs>
                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#10b981" }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, "Spent"]}
              />
              <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#spendingGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-end">
          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400">
            ₹7,000 under
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
