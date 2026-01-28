"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Sparkles,
    Wallet,
    PiggyBank,
    Target,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    ArrowRight,
    Lightbulb,
    Clock,
} from "lucide-react"
import { getBudgetAdvice, type BudgetAdviceResponse, type BudgetRecommendation } from "@/lib/api/budget"
import { getGoals, type Goal } from "@/lib/api/goals"
import { getLoanRecommendations, type SmartLoanAdviceResponse, type LoanRecommendation, type RepaymentPlan } from "@/lib/api/loans"

/**
 * @file Action Plan Page
 * @brief Council Synthesis - Unified monthly action plan from all financial agents.
 * 
 * @description
 * This page aggregates recommendations from:
 * - Budget Agent: Spending optimizations and potential savings
 * - Savings Agent: Goal progress and contribution actions
 * - Debt Manager: Repayment strategy and immediate actions
 * - Investment Scout: (TODO) Investment recommendations
 * 
 * The page provides a single, actionable view of what the user should do this month
 * to optimize their financial health.
 */

// =============================================================================
// HELPERS
// =============================================================================

/**
 * @brief Get auth token from cookie.
 */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
}

/**
 * @brief Format currency in Indian Rupee format.
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ActionPlanPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    // Agent data states
    const [budgetAdvice, setBudgetAdvice] = useState<BudgetAdviceResponse | null>(null)
    const [goals, setGoals] = useState<Goal[]>([])
    const [loanAdvice, setLoanAdvice] = useState<SmartLoanAdviceResponse['data'] | null>(null)

    // Error states for graceful degradation
    const [budgetError, setBudgetError] = useState(false)
    const [goalsError, setGoalsError] = useState(false)
    const [loanError, setLoanError] = useState(false)

    /**
     * @brief Fetch all agent data in parallel for optimal performance.
     * 
     * Uses Promise.allSettled to ensure partial failures don't block the entire page.
     * Each agent's data is handled independently to maximize data availability.
     */
    const fetchAllAgentData = useCallback(async () => {
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        console.log('[ActionPlan] Fetching data for:', { month, year })

        const [budgetResult, goalsResult, loansResult] = await Promise.allSettled([
            getBudgetAdvice(month, year),
            getGoals(),
            getLoanRecommendations(),
        ])

        // Process Budget Agent results
        console.log('[ActionPlan] Budget result raw:', budgetResult)
        if (budgetResult.status === 'fulfilled') {
            console.log('[ActionPlan] Budget value:', budgetResult.value)
            if (budgetResult.value?.data) {
                console.log('[ActionPlan] Budget data:', budgetResult.value.data)
                console.log('[ActionPlan] Budget recommendations:', budgetResult.value.data.recommendations)
                setBudgetAdvice(budgetResult.value.data)
                setBudgetError(false)
            } else {
                console.error('[ActionPlan] Budget data missing in response:', budgetResult.value)
                setBudgetError(true)
            }
        } else {
            console.error('[ActionPlan] Budget Agent failed:', budgetResult.reason)
            setBudgetError(true)
        }

        // Process Savings Agent results
        console.log('[ActionPlan] Goals result raw:', goalsResult)
        if (goalsResult.status === 'fulfilled') {
            console.log('[ActionPlan] Goals value:', goalsResult.value)
            if (goalsResult.value?.data) {
                console.log('[ActionPlan] Goals data (count):', goalsResult.value.data.length)
                console.log('[ActionPlan] Goals:', goalsResult.value.data)
                setGoals(goalsResult.value.data)
                setGoalsError(false)
            } else {
                console.error('[ActionPlan] Goals data missing in response:', goalsResult.value)
                setGoalsError(true)
            }
        } else {
            console.error('[ActionPlan] Savings Agent failed:', goalsResult.reason)
            setGoalsError(true)
        }

        // Process Debt Manager results
        // Note: getLoanRecommendations returns { success: boolean, data: {...} }
        if (loansResult.status === 'fulfilled') {
            console.log('[ActionPlan] Loan result raw:', loansResult.value)
            if (loansResult.value?.data) {
                setLoanAdvice(loansResult.value.data)
                setLoanError(false)
            } else if (loansResult.value?.success === false) {
                console.error('[ActionPlan] Loan API returned failure:', loansResult.value)
                setLoanError(true)
            } else {
                console.error('[ActionPlan] Loan data missing in response:', loansResult.value)
                setLoanError(true)
            }
        } else {
            console.error('[ActionPlan] Debt Manager failed:', loansResult)
            setLoanError(true)
        }

        setIsLoading(false)
    }, [])

    useEffect(() => {
        const token = getCookie('auth_token')
        if (!token) {
            router.push('/auth/login')
            return
        }
        fetchAllAgentData()
    }, [router, fetchAllAgentData])

    // =============================================================================
    // DERIVED DATA FOR COUNCIL SUMMARY
    // =============================================================================

    /**
     * @brief Generate high-level summary bullets from all agent data.
     */
    const generateCouncilSummary = () => {
        const bullets: { icon: React.ReactNode; text: string; type: 'success' | 'warning' | 'info' }[] = []

        // Budget Agent summary
        if (budgetAdvice?.recommendations?.length) {
            const topRec = budgetAdvice.recommendations[0]
            bullets.push({
                icon: <Wallet className="w-4 h-4" />,
                text: `Reduce ${topRec.category} spending to save ${formatCurrency(topRec.potential_savings)}/month`,
                type: 'warning'
            })
        } else if (budgetAdvice) {
            bullets.push({
                icon: <CheckCircle2 className="w-4 h-4" />,
                text: "Your spending is well optimized this month",
                type: 'success'
            })
        }

        // Savings Agent summary
        const topGoal = goals.find(g => g.status !== 'achieved')
        if (topGoal) {
            bullets.push({
                icon: <Target className="w-4 h-4" />,
                text: `Focus on "${topGoal.title}" - ${formatCurrency(topGoal.monthlyContribution || 0)} monthly contribution recommended`,
                type: 'info'
            })
        } else if (goals.length === 0) {
            bullets.push({
                icon: <PiggyBank className="w-4 h-4" />,
                text: "Create your first savings goal to start building wealth",
                type: 'info'
            })
        }

        // Debt Manager summary
        if (loanAdvice?.repaymentPlan?.length) {
            const topDebt = loanAdvice.repaymentPlan[0]
            bullets.push({
                icon: <TrendingDown className="w-4 h-4" />,
                text: `Prioritize ${topDebt.loanName} - Extra ${formatCurrency(topDebt.suggestedPayment)} saves ${formatCurrency(topDebt.interestSaved)} in interest`,
                type: 'warning'
            })
        } else if (loanAdvice?.loans?.length) {
            // Has loans but no repayment plan - show loan summary
            const topLoan = loanAdvice.loans[0]
            bullets.push({
                icon: <TrendingDown className="w-4 h-4" />,
                text: `Manage ${topLoan.name} - ${formatCurrency(topLoan.outstandingAmount)} outstanding at ${topLoan.interestRate}% APR`,
                type: 'warning'
            })
        } else if (loanAdvice) {
            bullets.push({
                icon: <CheckCircle2 className="w-4 h-4" />,
                text: "You're debt-free! Keep up the good work 🎉",
                type: 'success'
            })
        }

        // Investment placeholder
        bullets.push({
            icon: <TrendingUp className="w-4 h-4" />,
            text: "Investment recommendations coming soon",
            type: 'info'
        })

        return bullets
    }

    const councilSummary = generateCouncilSummary()

    // =============================================================================
    // RENDER
    // =============================================================================

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Consulting your Money Council...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-primary" />
                            Your Monthly Action Plan
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Based on your current income, spending, and goals for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Council Summary */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        Council Summary
                    </CardTitle>
                    <CardDescription>Key actions for this month from your Money Council</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {councilSummary.map((item, idx) => (
                            <div
                                key={idx}
                                className={`flex items-start gap-3 p-3 rounded-lg border ${item.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                    item.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                                        'bg-blue-500/10 border-blue-500/20'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-full ${item.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                                    item.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                    {item.icon}
                                </div>
                                <p className="text-sm text-foreground flex-1">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Agent Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Budget Agent Section */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Wallet className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Budget Agent</CardTitle>
                                    <CardDescription className="text-xs">Spending optimizations</CardDescription>
                                </div>
                            </div>
                            <Link href="/dashboard/budget">
                                <Button variant="ghost" size="sm" className="text-xs">
                                    View All <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {budgetError ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Could not load budget recommendations</p>
                            </div>
                        ) : budgetAdvice?.recommendations?.length ? (
                            <div className="space-y-4">
                                {/* Potential Savings Highlight */}
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <p className="text-xs text-muted-foreground">Potential Monthly Savings</p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatCurrency(budgetAdvice.estimated_monthly_savings)}
                                    </p>
                                </div>

                                {/* Top 2-3 Recommendations */}
                                <div className="space-y-2">
                                    {budgetAdvice.recommendations.slice(0, 3).map((rec, idx) => (
                                        <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/30">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-sm text-foreground">{rec.category}</span>
                                                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">
                                                    Save {formatCurrency(rec.potential_savings)}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{rec.action_item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                                <p className="text-sm text-emerald-500 font-medium">Spending is optimized!</p>
                                <p className="text-xs text-muted-foreground">No major areas to cut back</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Savings Agent Section */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <PiggyBank className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Savings Agent</CardTitle>
                                    <CardDescription className="text-xs">Goal progress</CardDescription>
                                </div>
                            </div>
                            <Link href="/dashboard/goals">
                                <Button variant="ghost" size="sm" className="text-xs">
                                    View All <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {goalsError ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Could not load savings goals</p>
                            </div>
                        ) : goals.length > 0 ? (
                            <div className="space-y-3">
                                {goals.filter(g => g.status !== 'achieved').slice(0, 2).map((goal) => (
                                    <div key={goal.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-sm text-foreground">{goal.title}</span>
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${goal.status === 'on_track'
                                                    ? 'border-emerald-500/30 text-emerald-500'
                                                    : 'border-amber-500/30 text-amber-500'
                                                    }`}
                                            >
                                                {goal.status === 'on_track' ? 'On Track' : 'Behind'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                                            </span>
                                            <span className="text-primary font-medium">
                                                {goal.progress}% complete
                                            </span>
                                        </div>
                                        {goal.monthlyContribution > 0 && (
                                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                <ArrowRight className="w-3 h-3" />
                                                Add {formatCurrency(goal.monthlyContribution)} this month
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {goals.filter(g => g.status === 'achieved').length > 0 && (
                                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {goals.filter(g => g.status === 'achieved').length} goal(s) achieved!
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm text-muted-foreground">No savings goals yet</p>
                                <Link href="/dashboard/goals">
                                    <Button variant="link" size="sm" className="text-xs text-primary">
                                        Create your first goal <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Debt Manager Section */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Debt Manager</CardTitle>
                                    <CardDescription className="text-xs">Repayment strategy</CardDescription>
                                </div>
                            </div>
                            <Link href="/dashboard/loans">
                                <Button variant="ghost" size="sm" className="text-xs">
                                    View All <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loanError ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Could not load debt recommendations</p>
                            </div>
                        ) : (loanAdvice?.loans?.length || loanAdvice?.recommendations?.length) ? (
                            <div className="space-y-3">
                                {/* Debt Strategy Headline */}
                                {loanAdvice.personalizedAdvice?.debtStrategy && (
                                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                        <p className="text-xs text-muted-foreground">Strategy</p>
                                        <p className="text-sm font-medium text-foreground">
                                            {loanAdvice.personalizedAdvice.debtStrategy.headline}
                                        </p>
                                    </div>
                                )}

                                {/* Show Repayment Plan if available */}
                                {loanAdvice.repaymentPlan?.length > 0 ? (
                                    <div className="space-y-2">
                                        {loanAdvice.repaymentPlan.slice(0, 2).map((step, idx) => (
                                            <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/30">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 text-xs flex items-center justify-center font-bold">
                                                        {step.step}
                                                    </span>
                                                    <span className="font-medium text-sm text-foreground">{step.loanName}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{step.explanation}</p>
                                                {step.interestSaved > 0 && (
                                                    <p className="text-xs text-emerald-500 mt-1">
                                                        Save {formatCurrency(step.interestSaved)} in interest
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : loanAdvice.loans?.length > 0 ? (
                                    /* Show loans summary if no repayment plan but loans exist */
                                    <div className="space-y-2">
                                        {loanAdvice.loans.slice(0, 2).map((loan, idx) => (
                                            <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/30">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-sm text-foreground">{loan.name}</span>
                                                    <Badge variant="outline" className="text-xs border-red-500/30 text-red-500">
                                                        {loan.interestRate}% APR
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Outstanding: {formatCurrency(loan.outstandingAmount)}
                                                </p>
                                                {loan.recommendedAction && (
                                                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                                        <ArrowRight className="w-3 h-3" />
                                                        {loan.recommendedAction}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : loanAdvice.recommendations?.length > 0 && (
                                    /* Show recommendations if available */
                                    <div className="space-y-2">
                                        {loanAdvice.recommendations.slice(0, 2).map((rec, idx) => (
                                            <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/30">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-sm text-foreground">{rec.title}</span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${rec.priority === 'high' ? 'border-red-500/30 text-red-500' :
                                                            rec.priority === 'medium' ? 'border-amber-500/30 text-amber-500' :
                                                                'border-emerald-500/30 text-emerald-500'
                                                            }`}
                                                    >
                                                        {rec.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{rec.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                                <p className="text-sm text-emerald-500 font-medium">You're debt-free! 🎉</p>
                                <p className="text-xs text-muted-foreground">No loans to manage</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Investment Scout Section (TODO Stub) */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <TrendingUp className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Investment Scout</CardTitle>
                                    <CardDescription className="text-xs">Smart investing</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-500">
                                Coming Soon
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500 opacity-50" />
                            <p className="text-sm text-muted-foreground">Investment recommendations</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Personalized investment advice based on your risk profile and goals is coming soon.
                            </p>
                            <Link href="/dashboard/investments">
                                <Button variant="ghost" size="sm" className="text-xs mt-3 text-purple-500">
                                    View Current Holdings <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
