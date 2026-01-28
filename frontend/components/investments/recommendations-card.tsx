"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, CheckCircle2, TrendingUp, Shield, Landmark, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    getInvestmentRecommendations,
    type Recommendation,
    type RecommendationsResponse
} from "@/lib/api/recommendations"

// =============================================================================
// ICON MAPPING
// =============================================================================

const typeIcons: Record<string, React.ReactNode> = {
    emergency_fund: <Shield className="w-4 h-4 text-blue-400" />,
    liquid_fund: <Shield className="w-4 h-4 text-cyan-400" />,
    ppf: <Landmark className="w-4 h-4 text-amber-400" />,
    index_sip: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    elss: <BarChart3 className="w-4 h-4 text-purple-400" />,
    stocks: <TrendingUp className="w-4 h-4 text-red-400" />,
}

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

function ActionPlanSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Generating action plan...</span>
            </div>
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary/50 shimmer" />
                    <div className="flex-1 space-y-1">
                        <div className="h-3 bg-secondary/50 rounded shimmer" style={{ width: `${80 - i * 10}%` }} />
                        <div className="h-2 bg-secondary/30 rounded shimmer" style={{ width: `${60 - i * 5}%` }} />
                    </div>
                </div>
            ))}
        </div>
    )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecommendationsCard() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [actionPlan, setActionPlan] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    // Fetch recommendations on mount
    useEffect(() => {
        fetchRecommendations()
    }, [])

    const fetchRecommendations = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const result: RecommendationsResponse = await getInvestmentRecommendations()
            if (result?.success && result?.data?.recommendations) {
                setRecommendations(result.data.recommendations)
                // Auto-select first recommendation
                if (result.data.recommendations.length > 0) {
                    handleSelectRecommendation(result.data.recommendations[0])
                }
            } else {
                // No recommendations available
                setRecommendations([])
            }
        } catch (err: any) {
            console.error('Failed to fetch recommendations:', err)
            setError("Unable to load recommendations. Add financial data to get personalized suggestions.")
            setRecommendations([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectRecommendation = async (rec: Recommendation) => {
        if (!rec) return;

        setSelectedId(rec.id)
        setIsGenerating(true)
        setActionPlan([])

        // Simulate generating effect
        await new Promise(resolve => setTimeout(resolve, 500))

        const plan: string[] = []

        // Step 1: Action item from recommendation
        if (rec.actionItem) {
            plan.push(rec.actionItem)
        } else {
            plan.push(`Start investing in ${rec.name} to build wealth.`)
        }

        // Step 2: Monthly amount
        if (rec.monthlyAmount > 0) {
            plan.push(`Start with ₹${rec.monthlyAmount.toLocaleString('en-IN')}/month (${rec.allocation} of income).`)
        } else {
            plan.push("Invest surplus funds as they become available.")
        }

        // Step 3: Set up automation
        if (rec.type === 'index_sip' || rec.type === 'elss') {
            plan.push("Set up auto-debit on salary day for consistent SIP investing.")
        } else if (rec.type === 'ppf') {
            plan.push("Consider annual lump sum before March for maximum benefit.")
        } else if (rec.type === 'emergency_fund') {
            plan.push("Keep in a high-interest savings account or liquid fund for easy access.")
        } else if (rec.type === 'liquid_fund') {
            plan.push("Use for parking short-term surplus funds.")
        } else {
            plan.push("Track your investment monthly and rebalance as needed.")
        }

        setActionPlan(plan)
        setIsGenerating(false)
    }

    const selectedRec = recommendations.find(r => r.id === selectedId)

    return (
        <Card className="bg-card border-border mb-4">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Recommendations
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* LHS - Recommendations List */}
                    <div className="bg-secondary/30 rounded-lg p-3 min-h-[200px]">
                        <p className="text-xs text-muted-foreground mb-3 font-medium">
                            Latest Recommendations
                        </p>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                                {error}
                            </div>
                        ) : recommendations.length === 0 ? (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                                No recommendations available
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                {recommendations.map((rec) => (
                                    <button
                                        key={rec.id}
                                        onClick={() => handleSelectRecommendation(rec)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg transition-all duration-200",
                                            "border border-transparent",
                                            "hover:bg-secondary/50",
                                            selectedId === rec.id
                                                ? "bg-primary/10 border-primary/50"
                                                : "bg-secondary/20"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                selectedId === rec.id ? "bg-primary/20" : "bg-secondary"
                                            )}>
                                                {typeIcons[rec.type] || <TrendingUp className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {rec.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    ₹{rec.monthlyAmount.toLocaleString('en-IN')}/month • {rec.allocation}
                                                </p>
                                                {rec.taxBenefit && (
                                                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded">
                                                        Tax Benefit
                                                    </span>
                                                )}
                                            </div>
                                            {selectedId === rec.id && (
                                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RHS - Action Plan */}
                    <div className="bg-secondary/30 rounded-lg p-3 min-h-[200px]">
                        <p className="text-xs text-muted-foreground mb-3 font-medium">
                            Action Plan
                        </p>

                        {!selectedRec ? (
                            <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
                                Select a recommendation to see action plan
                            </div>
                        ) : isGenerating ? (
                            <ActionPlanSkeleton />
                        ) : (
                            <div className="space-y-3">
                                {/* Recommendation Header */}
                                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                    {typeIcons[selectedRec.type]}
                                    <span className="text-sm font-medium text-foreground">
                                        {selectedRec.name}
                                    </span>
                                </div>

                                {/* Action Steps */}
                                <div className="space-y-2">
                                    {actionPlan.map((step, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                                                "bg-primary/20 text-primary"
                                            )}>
                                                {idx + 1}
                                            </span>
                                            <p className="text-sm text-foreground/90 leading-relaxed">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Reason */}
                                {selectedRec.reason && (
                                    <div className="mt-3 pt-2 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground italic">
                                            💡 {selectedRec.reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
