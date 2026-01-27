'use client';

import { useState, useEffect } from 'react';
import {
    getLoanRecommendations,
    SmartLoanAdviceResponse,
    FinancialSnapshot,
    MonthlySavingsData,
    LoanDetail,
    RepaymentPlan,
    LoanRecommendation
} from '@/lib/api/loans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Brain,
    TrendingDown,
    Wallet,
    PiggyBank,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    Lightbulb,
    Target,
    IndianRupee,
    Calendar,
    Loader2,
    ChevronRight,
    Shield,
    Zap
} from 'lucide-react';

interface SmartRecommendationsProps {
    className?: string;
}

export function SmartRecommendations({ className }: SmartRecommendationsProps) {
    const [data, setData] = useState<SmartLoanAdviceResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getLoanRecommendations();
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Analyzing your financial data...</span>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                    <p className="text-destructive font-medium">{error}</p>
                    <Button variant="outline" onClick={fetchRecommendations} className="mt-4">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const { snapshot, monthlySavingsHistory, loans, repaymentPlan, recommendations, summary } = data;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                    <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Smart Loan Advisor</h2>
                    <p className="text-muted-foreground">AI-powered recommendations based on your financial history</p>
                </div>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="recommendations" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/20 p-1">
                    <TabsTrigger value="recommendations" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Recommendations</TabsTrigger>
                    <TabsTrigger value="repayment" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Repayment Plan</TabsTrigger>
                    <TabsTrigger value="loans" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Loan Priority</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Savings History</TabsTrigger>
                </TabsList>

                <TabsContent value="recommendations" className="mt-6">
                    <RecommendationsView recommendations={recommendations} summary={summary} />
                </TabsContent>

                <TabsContent value="repayment" className="mt-6">
                    <RepaymentPlanView repaymentPlan={repaymentPlan} summary={summary} />
                </TabsContent>

                <TabsContent value="loans" className="mt-6">
                    <LoanPriorityView loans={loans} />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <SavingsHistoryView history={monthlySavingsHistory} />
                </TabsContent>
            </Tabs>

            {/* Financial Snapshot - Moved to bottom */}
            <FinancialSnapshotCard snapshot={snapshot} />
        </div>
    );
}

// Financial Snapshot Component
function FinancialSnapshotCard({ snapshot }: { snapshot: FinancialSnapshot }) {
    const savingsRateColor = snapshot.averageSavingsRate > 20 ? 'text-teal-400' :
        snapshot.averageSavingsRate > 10 ? 'text-amber-500' : 'text-rose-500';

    const emergencyStatusColor = snapshot.emergencyFundStatus === 'adequate'
        ? 'bg-teal-500/10 text-teal-500 hover:bg-teal-500/20'
        : snapshot.emergencyFundStatus === 'partial'
            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
            : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20';

    return (
        <Card className="bg-gradient-to-br from-card to-background border-border shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Your Financial Snapshot
                </CardTitle>
                <CardDescription>Based on the last 3 months of transaction history</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={Wallet}
                        label="Monthly Income"
                        value={`₹${snapshot.monthlyIncome.toLocaleString('en-IN')}`}
                        iconColor="text-teal-500"
                    />
                    <StatCard
                        icon={TrendingDown}
                        label="Monthly Expenses"
                        value={`₹${snapshot.monthlyExpenses.toLocaleString('en-IN')}`}
                        iconColor="text-rose-500"
                    />
                    <StatCard
                        icon={PiggyBank}
                        label="Monthly Surplus"
                        value={`₹${snapshot.monthlySurplus.toLocaleString('en-IN')}`}
                        iconColor="text-blue-500"
                    />
                    <StatCard
                        icon={IndianRupee}
                        label="Total Debt"
                        value={`₹${snapshot.totalDebt.toLocaleString('en-IN')}`}
                        iconColor="text-orange-500"
                    />
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-accent/50 border border-border shadow-sm">
                        <p className="text-xs text-muted-foreground">Savings Rate</p>
                        <p className={`text-xl font-bold ${savingsRateColor}`}>
                            {snapshot.averageSavingsRate.toFixed(1)}%
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50 border border-border shadow-sm">
                        <p className="text-xs text-muted-foreground">Emergency Fund</p>
                        <Badge className={`${emergencyStatusColor} border-0 mt-1`}>
                            {snapshot.emergencyFundStatus === 'adequate' ? 'Adequate' :
                                snapshot.emergencyFundStatus === 'partial' ? 'Partial' : 'None'}
                        </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50 border border-border shadow-sm">
                        <p className="text-xs text-muted-foreground">Idle Cash Detected</p>
                        <p className="text-xl font-bold text-violet-500">
                            ₹{snapshot.idleCash.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50 border border-border shadow-sm">
                        <p className="text-xs text-muted-foreground">Consistent Savings</p>
                        <p className="text-xl font-bold text-foreground">
                            {snapshot.consistentSavingsMonths} months
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Stat Card Sub-component
function StatCard({ icon: Icon, label, value, iconColor }: { icon: any; label: string; value: string; iconColor: string }) {
    return (
        <div className="p-4 rounded-lg bg-accent/50 border border-border hover:bg-accent/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${iconColor}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
    );
}

// RecommendationsView
function RecommendationsView({
    recommendations,
    summary
}: {
    recommendations: LoanRecommendation[];
    summary: SmartLoanAdviceResponse['data']['summary'];
}) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'low': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
            default: return 'bg-accent text-muted-foreground';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'loan_payoff': return TrendingDown;
            case 'emergency_fund': return Shield;
            case 'savings': return PiggyBank;
            case 'investment': return Zap;
            default: return Lightbulb;
        }
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-teal-500/5 border-teal-500/20 hover:bg-teal-500/10 transition-colors">
                    <CardContent className="pt-6">
                        <p className="text-sm text-teal-400 font-medium">Potential Interest Savings</p>
                        <p className="text-3xl font-bold text-teal-400">
                            ₹{summary.totalPotentialInterestSaved.toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 transition-colors">
                    <CardContent className="pt-6">
                        <p className="text-sm text-blue-500 font-medium">Total Idle Savings Detected</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            ₹{summary.totalIdleSavings.toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-violet-500/5 border-violet-500/20 hover:bg-violet-500/10 transition-colors">
                    <CardContent className="pt-6">
                        <p className="text-sm text-violet-500 font-medium">Debt-Free Faster By</p>
                        <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                            {summary.debtFreeMonthsReduction} months
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
                {recommendations.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="flex flex-col items-center py-12">
                            <CheckCircle2 className="h-16 w-16 text-teal-500 mb-4" />
                            <h3 className="text-xl font-semibold">Great Financial Health!</h3>
                            <p className="text-muted-foreground text-center mt-2">
                                You're managing your finances well. No urgent recommendations at this time.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    recommendations.map((rec, index) => {
                        const TypeIcon = getTypeIcon(rec.type);
                        return (
                            <Card key={rec.id} className="bg-card border-border hover:border-primary/50 hover:shadow-md transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-violet-500/10">
                                            <TypeIcon className="h-6 w-6 text-violet-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">{rec.title}</h3>
                                                <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                                                    {rec.priority.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground mb-4">{rec.description}</p>

                                            {rec.potentialSavings && rec.potentialSavings > 0 && (
                                                <div className="mb-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
                                                    <p className="text-sm text-teal-400">
                                                        <span className="font-semibold">Potential Savings: </span>
                                                        ₹{rec.potentialSavings.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Action Items:</p>
                                                <ul className="space-y-1">
                                                    {rec.actionItems.map((item, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                            <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                                    <span className="font-semibold">Impact: </span>
                                                    {rec.impact}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// RepaymentPlanView
function RepaymentPlanView({
    repaymentPlan,
    summary
}: {
    repaymentPlan: RepaymentPlan[];
    summary: SmartLoanAdviceResponse['data']['summary'];
}) {
    if (repaymentPlan.length === 0) {
        return (
            <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-teal-500 mb-4" />
                    <h3 className="text-xl font-semibold">No Active Loans</h3>
                    <p className="text-muted-foreground text-center mt-2">
                        You don't have any active loans that require a repayment plan.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const totalInterestSaved = repaymentPlan.reduce((sum, step) => sum + step.interestSaved, 0);

    return (
        <div className="space-y-6">
            {/* Plan Summary */}
            <Card className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium opacity-90">Optimized Repayment Plan</h3>
                            <p className="text-3xl font-bold mt-2">
                                Save ₹{totalInterestSaved.toLocaleString('en-IN')} in interest
                            </p>
                        </div>
                        <div className="p-4 rounded-full bg-white/20">
                            <TrendingDown className="h-8 w-8" />
                        </div>
                    </div>
                    <p className="mt-4 text-sm opacity-80">
                        By following this plan, you could become debt-free {summary.debtFreeMonthsReduction} months earlier!
                    </p>
                </CardContent>
            </Card>

            {/* Step-by-Step Plan */}
            <div className="relative">
                {repaymentPlan.map((step, index) => (
                    <div key={step.step} className="relative pl-8 pb-8 last:pb-0">
                        {/* Connector Line */}
                        {index < repaymentPlan.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-violet-500/50 to-violet-500/20" />
                        )}

                        {/* Step Number */}
                        <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {step.step}
                        </div>

                        <Card className="ml-4 bg-card border-border hover:border-primary/50 transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-semibold text-lg">{step.loanName}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Interest Rate: {step.interestRate}%
                                        </p>
                                    </div>
                                    <Badge className="bg-teal-500/10 text-teal-500 border-0">
                                        Save ₹{step.interestSaved.toLocaleString('en-IN')}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center p-3 rounded-lg bg-accent/50">
                                        <p className="text-xs text-muted-foreground">Current Outstanding</p>
                                        <p className="font-semibold">₹{step.currentOutstanding.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-violet-500/10">
                                        <p className="text-xs text-muted-foreground">Suggested Payment</p>
                                        <p className="font-semibold text-violet-500">₹{step.suggestedPayment.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-teal-500/10">
                                        <p className="text-xs text-muted-foreground">New Outstanding</p>
                                        <p className="font-semibold text-teal-500">₹{step.newOutstanding.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground italic">
                                    {step.explanation}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}

// LoanPriorityView
function LoanPriorityView({ loans }: { loans: LoanDetail[] }) {
    if (loans.length === 0) {
        return (
            <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
                    <h3 className="text-xl font-semibold">No Active Loans</h3>
                    <p className="text-muted-foreground text-center mt-2">
                        You're debt-free! Keep up the great work.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="bg-amber-500/10 border-amber-500/20 border-l-4 border-l-amber-500">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <Lightbulb className="h-6 w-6 text-amber-500" />
                        <div>
                            <h3 className="font-semibold text-amber-500">Debt Avalanche Strategy</h3>
                            <p className="text-sm text-muted-foreground">
                                Loans are prioritized by interest rate. Pay off high-interest loans first to minimize total interest paid.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loans.map((loan, index) => (
                <Card key={loan.id} className={`${index === 0 ? 'border-red-500 shadow-md shadow-red-500/10' : 'border-border'} bg-card hover:bg-accent/5 transition-colors`}>
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-red-500 shadow-lg shadow-red-500/20' : index === 1 ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    #{loan.priority}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg">{loan.name}</h4>
                                    <Badge variant="outline" className="mt-1">{loan.loanType}</Badge>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-red-500">{loan.interestRate}%</p>
                                <p className="text-xs text-muted-foreground">Interest Rate</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-accent/50">
                                <p className="text-xs text-muted-foreground">Outstanding</p>
                                <p className="font-semibold">₹{loan.outstandingAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-accent/50">
                                <p className="text-xs text-muted-foreground">Monthly EMI</p>
                                <p className="font-semibold">₹{loan.emiAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-accent/50">
                                <p className="text-xs text-muted-foreground">Months Remaining</p>
                                <p className="font-semibold">{loan.monthsRemaining}</p>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-500">
                                <span className="font-semibold">Total Interest if Continued: </span>
                                ₹{loan.totalInterestIfContinued.toLocaleString('en-IN')}
                            </p>
                        </div>

                        <p className="mt-4 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Recommended: </span>
                            {loan.recommendedAction}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// SavingsHistoryView
function SavingsHistoryView({ history }: { history: MonthlySavingsData[] }) {
    if (history.length === 0) {
        return (
            <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No History Available</h3>
                    <p className="text-muted-foreground text-center mt-2">
                        We need at least 3 months of transaction history to analyze your savings patterns.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const maxIncome = Math.max(...history.map(h => h.income));

    return (
        <div className="space-y-6">
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Monthly Savings Analysis
                    </CardTitle>
                    <CardDescription>
                        Tracking your income, expenses, and idle savings over time
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {history.map((month) => {
                            const incomeWidth = (month.income / maxIncome) * 100;
                            const expenseWidth = (month.expenses / month.income) * 100;
                            const savingsRate = ((month.surplus / month.income) * 100).toFixed(1);

                            return (
                                <div key={month.month} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{month.month}</h4>
                                        <Badge variant="outline">
                                            {savingsRate}% savings rate
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs w-20 text-muted-foreground">Income</span>
                                            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-teal-500 rounded-full"
                                                    style={{ width: `${incomeWidth}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium w-24 text-right">
                                                ₹{month.income.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs w-20 text-muted-foreground">Expenses</span>
                                            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-rose-500 rounded-full"
                                                    style={{ width: `${Math.min(expenseWidth, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium w-24 text-right">
                                                ₹{month.expenses.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs w-20 text-muted-foreground">Surplus</span>
                                            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(month.surplus / month.income) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium w-24 text-right">
                                                ₹{month.surplus.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        {month.idleSavings > 0 && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs w-20 text-violet-500 font-medium">Idle Cash</span>
                                                <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-violet-500 rounded-full"
                                                        style={{ width: `${(month.idleSavings / month.income) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium w-24 text-right text-violet-500">
                                                    ₹{month.idleSavings.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Idle Savings Alert */}
            {history.some(h => h.idleSavings > 0) && (
                <Card className="bg-violet-500/10 border-violet-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-violet-500/20">
                                <Lightbulb className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-violet-500">Idle Savings Detected</h3>
                                <p className="text-sm text-foreground/80 mt-1">
                                    We've detected surplus money that wasn't invested or used for debt repayment.
                                    Consider using this idle cash to pay down high-interest loans and save on interest!
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default SmartRecommendations;
