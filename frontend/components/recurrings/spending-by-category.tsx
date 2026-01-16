"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { type RecurringSubscription } from "@/lib/api/recurrings"

interface SpendingByCategoryProps {
  subscriptions: RecurringSubscription[]
}

const COLORS = [
  "#E50914", // Entertainment
  "#FF9900", // Shopping
  "#1DB954", // Music/Health
  "#0A2351", // Utilities
  "#6366F1", // Productivity
  "#387ED1", // Finance
  "#FC8019", // Food
  "#007AFF", // Cloud
];

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

export function SpendingByCategory({ subscriptions }: SpendingByCategoryProps) {
  const activeSubs = subscriptions.filter(s => s.status === 'active');

  // Calculate per category
  const categoryTotals: Record<string, { name: string; value: number; subscriptions: number }> = {};

  activeSubs.forEach(s => {
    let monthlyAmount = s.amount;
    if (s.frequency === 'yearly') monthlyAmount = s.amount / 12;
    if (s.frequency === 'weekly') monthlyAmount = s.amount * 4.33;

    if (!categoryTotals[s.category]) {
      categoryTotals[s.category] = { name: s.category, value: 0, subscriptions: 0 };
    }
    categoryTotals[s.category].value += monthlyAmount;
    categoryTotals[s.category].subscriptions += 1;
  });

  const categoryData = Object.values(categoryTotals)
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length]
    }));

  const total = activeSubs.reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + s.amount;
    if (s.frequency === 'yearly') return sum + (s.amount / 12);
    if (s.frequency === 'weekly') return sum + (s.amount * 4.33);
    return sum;
  }, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Spending by Category</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly total: <span className="text-foreground font-medium">₹{Math.round(total).toLocaleString("en-IN")}</span>
        </p>
      </CardHeader>

      <CardContent>
        {categoryData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No active subscriptions</p>
          </div>
        ) : (
          <>
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
                    ₹{Math.round(category.value).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
