"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const categoryData = [
  { name: "Entertainment", value: 1196, color: "#E50914", subscriptions: 4 },
  { name: "Utilities", value: 2999, color: "#FFC107", subscriptions: 2 },
  { name: "Health & Fitness", value: 2500, color: "#FF5722", subscriptions: 1 },
  { name: "Shopping", value: 1499, color: "#FF9900", subscriptions: 1 },
  { name: "Productivity", value: 800, color: "#6366F1", subscriptions: 1 },
  { name: "Finance", value: 200, color: "#387ED1", subscriptions: 1 },
  { name: "Food & Delivery", value: 149, color: "#FC8019", subscriptions: 1 },
  { name: "Cloud Storage", value: 75, color: "#007AFF", subscriptions: 1 },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">₹{data.value.toLocaleString("en-IN")}/month</p>
        <p className="text-xs text-muted-foreground">{data.subscriptions} subscription(s)</p>
      </div>
    )
  }
  return null
}

export function SpendingByCategory() {
  const total = categoryData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Spending by Category</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly total: <span className="text-foreground font-medium">₹{total.toLocaleString("en-IN")}</span>
        </p>
      </CardHeader>

      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {categoryData.slice(0, 6).map((category) => (
            <div key={category.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="text-xs text-muted-foreground truncate">{category.name}</span>
              <span className="text-xs font-medium text-foreground ml-auto">
                ₹{category.value.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
