"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine } from "recharts"
import { TaxComparison } from "@/lib/api/tax"

interface TaxSummaryChartProps {
    comparison: TaxComparison
}

export function TaxSummaryChart({ comparison }: TaxSummaryChartProps) {
    const data = [
        {
            name: "Old Regime",
            tax: comparison.oldRegime.totalTax,
            deductions: comparison.oldRegime.totalDeductions,
            income: comparison.oldRegime.taxableIncome,
            color: comparison.recommended === 'old' ? '#10b981' : '#64748b'
        },
        {
            name: "New Regime",
            tax: comparison.newRegime.totalTax,
            deductions: comparison.newRegime.totalDeductions,
            income: comparison.newRegime.taxableIncome,
            color: comparison.recommended === 'new' ? '#10b981' : '#64748b'
        }
    ]

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value)
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
                    <p className="font-semibold mb-2 text-popover-foreground">{label}</p>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Tax Payable:</span>
                            <span className="font-bold text-red-500">{formatCurrency(payload[0].value)}</span>
                        </div>
                        {label === "Old Regime" && (
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Deductions Claimed:</span>
                                <span className="font-medium text-emerald-500">{formatCurrency(payload[0].payload.deductions)}</span>
                            </div>
                        )}
                        <div className="flex justify-between gap-4 border-t pt-1 mt-1">
                            <span className="text-muted-foreground">Taxable Income:</span>
                            <span className="font-medium text-foreground">{formatCurrency(payload[0].payload.income)}</span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="col-span-1 bg-card border-border h-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    Tax Liability Comparison
                </CardTitle>
                <CardDescription>
                    Visual breakdown of tax impact between regimes
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={100}
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar
                                dataKey="tax"
                                radius={[0, 4, 4, 0]}
                                barSize={40}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Recommended Regime (Lowest Tax)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500" />
                        <span>Higher Tax Option</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
