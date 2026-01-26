/**
 * @file lib/mock/digital-twin-simulator.ts
 * @brief Client-side mock implementation of Digital Twin simulation
 * 
 * This is a complete stub that simulates the AI Engine logic locally
 * for demo purposes without requiring backend connectivity.
 */

import type {
    TwinSimulateRequest,
    TwinSimulateResponse,
    MonthlySnapshot,
    ScenarioType,
} from "@/lib/api/ai-engine"

// Scenario modifiers
const SCENARIO_MODIFIERS: Record<ScenarioType, { wants: number; needs: number; income: number; description: string }> = {
    baseline: { wants: 1.0, needs: 1.0, income: 1.0, description: "No changes to current behavior" },
    increased_savings: { wants: 0.90, needs: 1.0, income: 1.0, description: "10% reduction in discretionary spending" },
    aggressive_savings: { wants: 0.75, needs: 0.95, income: 1.0, description: "25% reduction in wants, 5% in needs" },
    job_loss: { wants: 0.30, needs: 0.70, income: 0.0, description: "Zero income, survival mode spending" },
    emi_prepayment: { wants: 0.85, needs: 1.0, income: 1.0, description: "Redirect savings to loan prepayment" },
}

const DEFAULT_ASSUMPTIONS = {
    incomeGrowthRate: 0.08, // 8% annual
    inflationRate: 0.06, // 6% annual
    savingsReturnRate: 0.07, // 7% annual
}

function addMonths(date: Date, months: number): Date {
    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
}

function formatYearMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Client-side simulation engine
 */
export function simulateDigitalTwin(request: TwinSimulateRequest): TwinSimulateResponse {
    const modifier = SCENARIO_MODIFIERS[request.scenario || 'baseline']
    const months = request.projection_months || 12
    const startDate = new Date()

    // Initialize state
    let currentSavings = request.current_state.savings
    let currentDebt = request.current_state.debt
    const currentAssets = request.current_state.assets
    let monthlyIncome = request.current_state.monthly_income
    let monthlyNeeds = request.current_state.monthly_expenses.needs
    let monthlyWants = request.current_state.monthly_expenses.wants
    const monthlyEmis = request.current_state.monthly_expenses.emis

    // Track EMIs
    const emis = (request.emis || []).map(emi => ({
        ...emi,
        remainingMonths: emi.remaining_months,
        active: true
    }))

    // Track goals
    const goals = (request.goals || []).map(goal => ({
        ...goal,
        currentProgress: goal.current,
        achieved: goal.current >= goal.target
    }))

    const snapshots: MonthlySnapshot[] = []
    const goalsAchieved: string[] = []
    let totalSavingsAdded = 0
    let totalDebtReduced = 0

    // Run simulation for each month
    for (let month = 1; month <= months; month++) {
        const currentMonth = addMonths(startDate, month - 1)
        const monthStr = formatYearMonth(currentMonth)

        // Apply scenario modifiers
        const income = monthlyIncome * modifier.income
        const needs = monthlyNeeds * modifier.needs
        const wants = monthlyWants * modifier.wants

        // Calculate active EMIs
        let activeEmiTotal = 0
        emis.forEach(emi => {
            if (emi.active && emi.remainingMonths > 0) {
                activeEmiTotal += emi.monthly_amount
                emi.remainingMonths--
                if (emi.remainingMonths <= 0) {
                    emi.active = false
                }
            }
        })

        // Total expenses
        const totalExpenses = needs + wants + activeEmiTotal

        // Net savings this month
        const savingsFlow = income - totalExpenses

        // Add return on existing savings (monthly compounding)
        const monthlyReturnRate = DEFAULT_ASSUMPTIONS.savingsReturnRate / 12
        const savingsReturn = currentSavings * monthlyReturnRate

        // Update cumulative savings
        currentSavings += savingsFlow + savingsReturn
        currentSavings = Math.max(0, currentSavings)

        if (savingsFlow > 0) {
            totalSavingsAdded += savingsFlow
        }

        // Update debt (40% of EMI goes to principal)
        const principalPaid = activeEmiTotal * 0.4
        currentDebt = Math.max(0, currentDebt - principalPaid)
        totalDebtReduced += principalPaid

        // Calculate net worth
        const networth = currentSavings + currentAssets - currentDebt

        // Update goal progress (50% of positive savings flow)
        const goalProgress = goals.map(goal => {
            if (!goal.achieved && savingsFlow > 0) {
                const availableForGoals = savingsFlow * 0.5
                const needed = goal.target - goal.currentProgress
                const contribution = Math.min(availableForGoals, needed)
                goal.currentProgress += contribution

                if (goal.currentProgress >= goal.target && !goal.achieved) {
                    goal.achieved = true
                    goalsAchieved.push(goal.name)
                }
            }

            const progressPercent = (goal.currentProgress / goal.target) * 100
            return {
                name: goal.name,
                target: goal.target,
                current: Math.round(goal.currentProgress),
                progress_percent: Math.min(100, Math.round(progressPercent * 100) / 100),
                remaining: Math.max(0, Math.round(goal.target - goal.currentProgress)),
                achieved: goal.achieved,
                on_track: goal.achieved || new Date(goal.deadline) >= currentMonth
            }
        })

        // Create snapshot
        snapshots.push({
            month,
            date: monthStr,
            income: Math.round(income),
            expenses: {
                needs: Math.round(needs),
                wants: Math.round(wants),
                emis: Math.round(activeEmiTotal),
                total: Math.round(totalExpenses)
            },
            savings_flow: Math.round(savingsFlow),
            cumulative_savings: Math.round(currentSavings),
            debt_remaining: Math.round(currentDebt),
            networth: Math.round(networth),
            goal_progress: goalProgress
        })

        // Apply annual adjustments at year boundaries
        if (month % 12 === 0) {
            monthlyIncome *= (1 + DEFAULT_ASSUMPTIONS.incomeGrowthRate)
            monthlyNeeds *= (1 + DEFAULT_ASSUMPTIONS.inflationRate)
            monthlyWants *= (1 + DEFAULT_ASSUMPTIONS.inflationRate)
        }
    }

    // Calculate summary
    const initialNetworth = request.current_state.savings + request.current_state.assets - request.current_state.debt
    const finalSnapshot = snapshots[snapshots.length - 1]
    const finalNetworth = finalSnapshot.networth
    const networthChange = finalNetworth - initialNetworth

    // Goals at risk
    const goalsAtRisk = goals
        .filter(g => !g.achieved)
        .map(g => ({
            name: g.name,
            target: g.target,
            projected: Math.round(g.currentProgress),
            shortfall: Math.round(g.target - g.currentProgress),
            deadline: g.deadline
        }))

    // Generate recommendations
    const recommendations = generateRecommendations(
        request.scenario || 'baseline',
        networthChange,
        goalsAtRisk,
        request.current_state.savings,
        request.current_state.monthly_expenses,
        currentDebt,
        request.current_state.debt
    )

    return {
        scenario: request.scenario || 'baseline',
        projection_months: months,
        monthly_snapshots: snapshots,
        summary: {
            initial_networth: Math.round(initialNetworth),
            final_networth: Math.round(finalNetworth),
            networth_change: Math.round(networthChange),
            total_savings_added: Math.round(totalSavingsAdded),
            total_debt_reduced: Math.round(totalDebtReduced),
            final_savings: Math.round(currentSavings),
            final_debt: Math.round(currentDebt),
            goals_achieved: goalsAchieved,
            goals_at_risk: goalsAtRisk
        },
        recommendations
    }
}

function generateRecommendations(
    scenario: ScenarioType,
    networthChange: number,
    goalsAtRisk: any[],
    initialSavings: number,
    expenses: any,
    finalDebt: number,
    initialDebt: number
): Array<{
    type: string
    priority: string
    title: string
    message: string
    action: string
}> {
    const recommendations = []

    // Net worth trajectory
    if (networthChange > 0) {
        const monthlyGrowth = networthChange / 12
        recommendations.push({
            type: "positive_trajectory",
            priority: "info",
            title: "Positive Financial Trajectory",
            message: `Your net worth grows by ₹${networthChange.toLocaleString('en-IN')} over this period`,
            action: `Continue current path - averaging ₹${monthlyGrowth.toLocaleString('en-IN')}/month growth`
        })
    } else {
        recommendations.push({
            type: "negative_trajectory",
            priority: "high",
            title: "Net Worth Declining",
            message: `Projected net worth decreases by ₹${Math.abs(networthChange).toLocaleString('en-IN')}`,
            action: "Urgent: Reduce expenses or increase income to reverse trend"
        })
    }

    // Goals at risk
    if (goalsAtRisk.length > 0) {
        goalsAtRisk.slice(0, 2).forEach(goal => {
            recommendations.push({
                type: "goal_at_risk",
                priority: "high",
                title: `'${goal.name}' May Not Be Met`,
                message: `Shortfall of ₹${goal.shortfall.toLocaleString('en-IN')} projected by deadline`,
                action: "Increase savings or extend deadline"
            })
        })
    }

    // Scenario-specific
    if (scenario === 'baseline') {
        recommendations.push({
            type: "scenario_suggestion",
            priority: "medium",
            title: "Consider Increased Savings",
            message: "Try the 'increased_savings' scenario to see potential gains",
            action: "Small lifestyle changes can significantly improve outcomes"
        })
    }

    if (scenario === 'job_loss') {
        const monthlyBurn = expenses.needs * 0.7 + expenses.emis
        const runwayMonths = Math.floor(initialSavings / monthlyBurn)
        recommendations.push({
            type: "emergency_runway",
            priority: "high",
            title: `Emergency Runway: ${runwayMonths} Months`,
            message: `Current savings cover ${runwayMonths} months of essential expenses`,
            action: "Build 6-month emergency fund for security"
        })
    }

    // Debt freedom
    if (finalDebt === 0 && initialDebt > 0) {
        recommendations.push({
            type: "debt_freedom",
            priority: "info",
            title: "🎉 Debt-Free by End of Projection!",
            message: "All debts will be cleared within this period",
            action: "Redirect EMI amounts to investments after payoff"
        })
    }

    return recommendations
}

/**
 * Mock scenario comparison
 */
export function compareScenarios(request: TwinSimulateRequest): {
    scenarios: Record<string, any>
    best_scenario: string
    recommendation: string
} {
    const scenariosToCompare: ScenarioType[] = ['baseline', 'increased_savings', 'aggressive_savings']
    const results: Record<string, any> = {}

    scenariosToCompare.forEach(scenario => {
        const simulation = simulateDigitalTwin({ ...request, scenario })
        results[scenario] = {
            final_networth: simulation.summary.final_networth,
            networth_change: simulation.summary.networth_change,
            goals_achieved: simulation.summary.goals_achieved.length,
            goals_at_risk: simulation.summary.goals_at_risk.length,
            total_savings: simulation.summary.total_savings_added,
            description: SCENARIO_MODIFIERS[scenario].description
        }
    })

    // Find best scenario
    const best = Object.entries(results).reduce((best, [scenario, data]) =>
        data.final_networth > best.data.final_networth ? { scenario, data } : best,
        { scenario: 'baseline', data: results.baseline }
    )

    return {
        scenarios: results,
        best_scenario: best.scenario,
        recommendation: `'${best.scenario}' yields highest net worth of ₹${best.data.final_networth.toLocaleString('en-IN')}`
    }
}

/**
 * Mock scenarios list
 */
export function getMockScenarios() {
    return {
        scenarios: Object.fromEntries(
            Object.entries(SCENARIO_MODIFIERS).map(([key, value]) => [key, value.description])
        ),
        default: "baseline"
    }
}