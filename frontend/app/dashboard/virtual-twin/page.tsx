/**
 * @file app/dashboard/virtual-twin/page.tsx
 * @brief Digital Financial Twin Simulator page.
 * 
 * @description
 * This page allows users to:
 * - Input their current financial state
 * - Run simulations for different scenarios
 * - View month-by-month projections
 * - Compare multiple scenarios side-by-side
 * 
 * @note Uses AI Engine /twin/* endpoints for all calculations.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Brain,
    TrendingUp,
    TrendingDown,
    Loader2,
    Play,
    GitCompare,
    Wallet,
    Target,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
} from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts"
import {
    getScenarios,
    runSimulation,
    compareScenarios,
    type TwinSimulateRequest,
    type TwinSimulateResponse,
    type ScenarioComparison,
    type ScenarioType,
    type CurrentState,
    type MonthlyExpenses,
} from "@/lib/api/ai-engine"
import { cn } from "@/lib/utils"

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * @brief Format currency in Indian Rupees.
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}

/**
 * @brief Format large numbers with K/L/Cr suffixes.
 */
function formatCompact(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// Cookie utility locally defined
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length >= 2) {
        const rawValue = parts.pop()?.split(';').shift();
        return rawValue ? decodeURIComponent(rawValue) : null;
    }
    return null;
}

export default function VirtualTwinPage() {
    // UI State
    const [activeTab, setActiveTab] = useState("simulate")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Scenario options (key: scenario_id, value: description)
    const [scenarioOptions, setScenarioOptions] = useState<Record<string, string>>({})

    // Form State - Current Financial State
    const [savings, setSavings] = useState("500000")
    const [debt, setDebt] = useState("0")
    const [assets, setAssets] = useState("0")
    const [monthlyIncome, setMonthlyIncome] = useState("100000")
    const [needsExpense, setNeedsExpense] = useState("35000")
    const [wantsExpense, setWantsExpense] = useState("20000")
    const [emisExpense, setEmisExpense] = useState("0")
    const [savingsContrib, setSavingsContrib] = useState("20000")
    const [projectionMonths, setProjectionMonths] = useState("24")
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("baseline")

    // Results
    const [simulationResult, setSimulationResult] = useState<TwinSimulateResponse | null>(null)
    const [comparisonResult, setComparisonResult] = useState<ScenarioComparison | null>(null)

    // ===========================================
    // LOAD SCENARIOS ON MOUNT
    // ===========================================

    useEffect(() => {
        const loadScenarios = async () => {
            // Strict auth check before API call
            // const token = getCookie('auth_token');
            // if (!token) {
            //     console.error("No auth token found in VirtualTwinPage, redirecting to login");
            //     window.location.href = '/auth/login';
            //     return;
            // }

            try {
                const data = await getScenarios()
                setScenarioOptions(data.scenarios)
            } catch (err) {
                console.error("Failed to load scenarios:", err)
                // Set default scenarios if API fails
                setScenarioOptions({
                    baseline: "No changes to current behavior",
                    increased_savings: "10% reduction in wants",
                    aggressive_savings: "25% reduction in wants",
                })
            }
        }
        loadScenarios()
    }, [])

    // ===========================================
    // BUILD REQUEST OBJECT
    // ===========================================

    const buildRequest = useCallback((): TwinSimulateRequest => {
        const expenses: MonthlyExpenses = {
            needs: parseFloat(needsExpense) || 0,
            wants: parseFloat(wantsExpense) || 0,
            emis: parseFloat(emisExpense) || 0,
            savings: parseFloat(savingsContrib) || 0,
        }

        const currentState: CurrentState = {
            savings: parseFloat(savings) || 0,
            debt: parseFloat(debt) || 0,
            assets: parseFloat(assets) || 0,
            monthly_income: parseFloat(monthlyIncome) || 0,
            monthly_expenses: expenses,
        }

        return {
            current_state: currentState,
            projection_months: parseInt(projectionMonths) || 24,
            scenario: selectedScenario,
        }
    }, [savings, debt, assets, monthlyIncome, needsExpense, wantsExpense, emisExpense, savingsContrib, projectionMonths, selectedScenario])

    // ===========================================
    // RUN SIMULATION
    // ===========================================

    const handleRunSimulation = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const request = buildRequest()
            const result = await runSimulation(request)
            setSimulationResult(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Simulation failed")
        } finally {
            setIsLoading(false)
        }
    }

    // ===========================================
    // RUN COMPARISON
    // ===========================================

    const handleRunComparison = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const request = buildRequest()
            const result = await compareScenarios(request)
            setComparisonResult(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Comparison failed")
        } finally {
            setIsLoading(false)
        }
    }

    // ===========================================
    // RENDER
    // ===========================================

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                        <Brain className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Digital Financial Twin</h1>
                        <p className="text-sm text-muted-foreground">
                            Simulate your financial future with AI-powered projections
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-400 w-fit">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Powered
                </Badge>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-secondary/50 border border-border p-1 h-12">
                    <TabsTrigger value="simulate" className="h-10 px-6 data-[state=active]:bg-background gap-2">
                        <Play className="w-4 h-4" />
                        Simulate
                    </TabsTrigger>
                    <TabsTrigger value="compare" className="h-10 px-6 data-[state=active]:bg-background gap-2">
                        <GitCompare className="w-4 h-4" />
                        Compare Scenarios
                    </TabsTrigger>
                </TabsList>

                {/* ============================================= */}
                {/* SIMULATE TAB */}
                {/* ============================================= */}
                <TabsContent value="simulate" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Input Form */}
                        <Card className="lg:col-span-1 bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-lg">Financial State</CardTitle>
                                <CardDescription>Enter your current financial situation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Current Assets */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Assets & Liabilities</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Savings</Label>
                                            <Input
                                                type="number"
                                                value={savings}
                                                onChange={(e) => setSavings(e.target.value)}
                                                className="bg-secondary border-border h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Total Debt</Label>
                                            <Input
                                                type="number"
                                                value={debt}
                                                onChange={(e) => setDebt(e.target.value)}
                                                className="bg-secondary border-border h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Monthly Income */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Income</h4>
                                    <Input
                                        type="number"
                                        value={monthlyIncome}
                                        onChange={(e) => setMonthlyIncome(e.target.value)}
                                        className="bg-secondary border-border"
                                    />
                                </div>

                                {/* Monthly Expenses */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Expenses</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Needs (50%)</Label>
                                            <Input
                                                type="number"
                                                value={needsExpense}
                                                onChange={(e) => setNeedsExpense(e.target.value)}
                                                className="bg-secondary border-border h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Wants (30%)</Label>
                                            <Input
                                                type="number"
                                                value={wantsExpense}
                                                onChange={(e) => setWantsExpense(e.target.value)}
                                                className="bg-secondary border-border h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">EMIs</Label>
                                            <Input
                                                type="number"
                                                value={emisExpense}
                                                onChange={(e) => setEmisExpense(e.target.value)}
                                                className="bg-secondary border-border h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Savings (20%)</Label>
                                            <Input
                                                type="number"
                                                value={savingsContrib}
                                                onChange={(e) => setSavingsContrib(e.target.value)}
                                                className="bg-secondary border-border h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Simulation Settings */}
                                <div className="space-y-3 pt-2 border-t border-border">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Simulation</h4>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Scenario</Label>
                                            <Select value={selectedScenario} onValueChange={(v) => setSelectedScenario(v as ScenarioType)}>
                                                <SelectTrigger className="bg-secondary border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(scenarioOptions).map(([key, description]) => (
                                                        <SelectItem key={key} value={key}>
                                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Projection Period (months)</Label>
                                            <Input
                                                type="number"
                                                value={projectionMonths}
                                                onChange={(e) => setProjectionMonths(e.target.value)}
                                                className="bg-secondary border-border"
                                                min="6"
                                                max="60"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
                                    onClick={handleRunSimulation}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4 mr-2" />
                                    )}
                                    Run Simulation
                                </Button>

                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                        <p className="text-sm text-destructive">{error}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Results */}
                        <div className="lg:col-span-2 space-y-6">
                            {simulationResult ? (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card className="bg-card border-border">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Wallet className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">Starting</span>
                                                </div>
                                                <p className="text-lg font-bold">{formatCompact(simulationResult.summary.initial_networth)}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card border-border">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Target className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">Final</span>
                                                </div>
                                                <p className="text-lg font-bold text-primary">{formatCompact(simulationResult.summary.final_networth)}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card border-border">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {simulationResult.summary.networth_change >= 0 ? (
                                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                                    )}
                                                    <span className="text-xs text-muted-foreground">Change</span>
                                                </div>
                                                <p className={cn(
                                                    "text-lg font-bold",
                                                    simulationResult.summary.networth_change >= 0 ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {simulationResult.summary.networth_change >= 0 ? "+" : ""}{formatCompact(simulationResult.summary.networth_change)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card border-border">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">Goals Achieved</span>
                                                </div>
                                                <p className="text-lg font-bold">{simulationResult.summary.goals_achieved.length}</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Projection Chart */}
                                    <Card className="bg-card border-border">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Net Worth Projection</CardTitle>
                                            <CardDescription>
                                                {simulationResult.projection_months} month projection under {selectedScenario.replace('_', ' ')} scenario
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-72">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={simulationResult.monthly_snapshots}>
                                                        <defs>
                                                            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                        <XAxis
                                                            dataKey="month"
                                                            tick={{ fill: '#888', fontSize: 12 }}
                                                            tickFormatter={(v) => `M${v}`}
                                                        />
                                                        <YAxis
                                                            tick={{ fill: '#888', fontSize: 12 }}
                                                            tickFormatter={(v) => formatCompact(v)}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                                                            formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                                                            labelFormatter={(label) => `Month ${label}`}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="networth"
                                                            stroke="#8b5cf6"
                                                            strokeWidth={2}
                                                            fill="url(#netWorthGradient)"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Recommendations */}
                                    {simulationResult.recommendations.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {simulationResult.recommendations
                                                .filter((r) => r.priority === 'info' || r.priority === 'medium')
                                                .slice(0, 3)
                                                .map((rec, i) => (
                                                    <Card key={i} className="bg-emerald-500/5 border-emerald-500/20">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                {rec.title}
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-muted-foreground">{rec.message}</p>
                                                            <p className="text-xs text-emerald-400 mt-2">{rec.action}</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            {simulationResult.recommendations
                                                .filter((r) => r.priority === 'high')
                                                .slice(0, 3)
                                                .map((rec, i) => (
                                                    <Card key={`warn-${i}`} className="bg-amber-500/5 border-amber-500/20">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
                                                                <AlertTriangle className="w-4 h-4" />
                                                                {rec.title}
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-muted-foreground">{rec.message}</p>
                                                            <p className="text-xs text-amber-400 mt-2">{rec.action}</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Card className="bg-card border-border h-full min-h-[400px] flex items-center justify-center">
                                    <div className="text-center px-8">
                                        <Brain className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">Ready to Simulate</h3>
                                        <p className="text-sm text-muted-foreground max-w-md">
                                            Enter your financial details on the left and click "Run Simulation" to see your projected financial future.
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* ============================================= */}
                {/* COMPARE TAB */}
                {/* ============================================= */}
                <TabsContent value="compare" className="space-y-6">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle>Scenario Comparison</CardTitle>
                            <CardDescription>
                                Compare baseline, increased savings, and aggressive savings scenarios side-by-side
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleRunComparison}
                                disabled={isLoading}
                                className="bg-violet-600 hover:bg-violet-700"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <GitCompare className="w-4 h-4 mr-2" />
                                )}
                                Compare All Scenarios
                            </Button>

                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-4">
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {comparisonResult && (
                        <>
                            {/* Best Scenario Banner */}
                            <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-full bg-violet-500/20">
                                            <Sparkles className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">AI Recommendation</p>
                                            <h3 className="text-xl font-bold text-foreground">
                                                {comparisonResult.best_scenario.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">{comparisonResult.recommendation}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Comparison Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(comparisonResult.scenarios).map(([scenario, summary]) => (
                                    <Card
                                        key={scenario}
                                        className={cn(
                                            "bg-card border-border relative overflow-hidden",
                                            scenario === comparisonResult.best_scenario && "ring-2 ring-violet-500"
                                        )}
                                    >
                                        {scenario === comparisonResult.best_scenario && (
                                            <div className="absolute top-0 right-0">
                                                <div className="bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                                                    Best
                                                </div>
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle className="text-lg capitalize">
                                                {scenario.replace('_', ' ')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Initial</span>
                                                    <span className="font-medium">{formatCompact(summary.initial_networth)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Final</span>
                                                    <span className="font-bold text-primary">{formatCompact(summary.final_networth)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Growth</span>
                                                    <span className={cn(
                                                        "font-medium",
                                                        summary.networth_change >= 0 ? "text-green-500" : "text-red-500"
                                                    )}>
                                                        {summary.networth_change >= 0 ? "+" : ""}{formatCompact(summary.networth_change)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Total Saved</span>
                                                    <span className="font-medium">{formatCompact(summary.total_savings_added)}</span>
                                                </div>
                                            </div>

                                            {summary.goals_achieved.length > 0 && (
                                                <div className="pt-3 border-t border-border">
                                                    <p className="text-xs text-muted-foreground mb-2">Goals Achieved</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {summary.goals_achieved.map((goal, i) => (
                                                            <Badge key={i} variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                                                                {goal}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
