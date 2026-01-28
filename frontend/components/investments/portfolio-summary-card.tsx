"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Wallet, TrendingDown, Shield, Zap, Rocket } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { type InvestmentSummary, type InvestmentHolding } from "@/lib/api/investments"
import { getRiskProfile } from "@/lib/api/recommendations"
import { cn } from "@/lib/utils"

interface PortfolioSummaryCardProps {
  summary: InvestmentSummary
  holdings: InvestmentHolding[]
}

const TYPE_COLORS: Record<string, string> = {
  'stock': "#10b981",
  'mutual_fund': "#6366f1",
  'crypto': "#f59e0b",
  'gold': "#eab308",
  'fd': "#64748b",
  'ppf': "#8b5cf6",
  'other': "#94a3b8"
};

const TYPE_LABELS: Record<string, string> = {
  'stock': 'Stocks',
  'mutual_fund': 'Mutual Funds',
  'crypto': 'Crypto',
  'gold': 'Gold',
  'fd': 'Fixed Deposits',
  'ppf': 'PPF',
  'other': 'Other'
};

type RiskProfileTier = 'Stability-Focused' | 'Growth-Ready' | 'Growth-Optimized';

const RISK_PROFILE_CONFIG: Record<RiskProfileTier, { color: string; bgColor: string; icon: React.ReactNode }> = {
  'Stability-Focused': {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: <Shield className="w-3 h-3" />
  },
  'Growth-Ready': {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: <Zap className="w-3 h-3" />
  },
  'Growth-Optimized': {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    icon: <Rocket className="w-3 h-3" />
  }
};

export function PortfolioSummaryCard({ summary, holdings }: PortfolioSummaryCardProps) {
  const [riskProfile, setRiskProfile] = useState<RiskProfileTier | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    fetchRiskProfile()
  }, [])

  const fetchRiskProfile = async () => {
    setIsLoadingProfile(true)
    try {
      const result = await getRiskProfile()
      if (result?.success && result?.data?.profile) {
        setRiskProfile(result.data.profile)
      }
    } catch (err) {
      console.error('Failed to fetch risk profile:', err)
      setRiskProfile(null)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Calculate breakdown by type
  const typeTotals: Record<string, number> = {};
  holdings.forEach(h => {
    const value = h.currentPrice * h.quantity;
    typeTotals[h.type] = (typeTotals[h.type] || 0) + value;
  });

  const portfolioData = Object.entries(typeTotals).map(([type, value]) => ({
    name: TYPE_LABELS[type] || type,
    value,
    color: TYPE_COLORS[type] || TYPE_COLORS['other']
  })).sort((a, b) => b.value - a.value);

  const isPositive = summary.totalReturns >= 0;
  const profileConfig = riskProfile ? RISK_PROFILE_CONFIG[riskProfile] : null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Portfolio Summary
          </CardTitle>

          {/* Risk Profile Tag */}
          {!isLoadingProfile && riskProfile && profileConfig && (
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
              profileConfig.bgColor,
              profileConfig.color
            )}>
              {profileConfig.icon}
              {riskProfile}
            </div>
          )}
          {isLoadingProfile && (
            <div className="h-6 w-24 bg-secondary/50 rounded-full animate-pulse" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-[140px] h-[140px]">
            {portfolioData.length > 0 ? (
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
            ) : (
              <div className="w-full h-full rounded-full border-4 border-muted flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                No Data
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-3xl font-bold text-foreground">₹{summary.currentValue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mb-3">Current Value</p>

            <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}₹{Math.abs(summary.totalReturns).toLocaleString()} ({summary.returnsPercentage.toFixed(2)}%)
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
          {portfolioData.length === 0 && (
            <p className="col-span-2 text-center text-xs text-muted-foreground py-2">Add assets to see breakdown</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
