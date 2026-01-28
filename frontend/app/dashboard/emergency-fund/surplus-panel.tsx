import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Sparkles,
    ArrowRightLeft,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    PiggyBank,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    EmergencyShieldStatus,
    SurplusRecommendation,
    reallocateSurplus,
    formatCurrency
} from "@/lib/api/emergency-shield";
import { getGoals, Goal } from "@/lib/api/goals";
import { getLoans, Loan } from "@/lib/api/loans";

interface SurplusPanelProps {
    status: EmergencyShieldStatus;
    recommendations: SurplusRecommendation[];
    onReallocate: () => void; // Callback to refresh status
}

export function SurplusPanel({ status, recommendations, onReallocate }: SurplusPanelProps) {
    const [selectedRec, setSelectedRec] = useState<SurplusRecommendation | null>(null);
    const [reallocateAmount, setReallocateAmount] = useState("");
    const [targetId, setTargetId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);

    // Load live goals & loans so destinations are always DB-backed
    useEffect(() => {
        async function loadDestinations() {
            try {
                const goalsRes = await getGoals();
                setGoals(goalsRes.data);

                const loansRes = await getLoans();
                setLoans(loansRes.data.loans);
            } catch (err) {
                // Soft-fail – surplus panel can still render, but selection may be limited
                console.error("Failed to load surplus destinations", err);
            }
        }

        loadDestinations();
    }, []);

    // If no surplus, don't show anything (or handled by parent)
    if (!status.hasSurplus || status.surplusEmergency <= 0) return null;

    const handleReallocation = async () => {
        if (!selectedRec || !reallocateAmount || Number(reallocateAmount) <= 0) return;

        const amount = Number(reallocateAmount);

        if (amount > status.surplusEmergency) {
            setError(
                `You can only reallocate up to your surplus of ${formatCurrency(
                    status.surplusEmergency
                )}. Core emergency remains locked.`
            );
            return;
        }

        const effectiveTargetId = targetId || selectedRec.targetId;
        if (!effectiveTargetId) {
            setError("Please select a valid destination goal or loan");
            return;
        }

        const targetType: "goal" | "loan" =
            selectedRec.targetType === "loan" ||
            loans.some((l) => l.id === effectiveTargetId)
                ? "loan"
                : "goal";

        try {
            setSubmitting(true);
            setError(null);

            // Source fund: use the largest emergency fund (best approximation of surplus bucket)
            const sourceFund = [...status.emergencyFunds].sort(
                (a, b) => b.currentAmount - a.currentAmount
            )[0];

            if (!sourceFund) {
                throw new Error("No emergency fund available as source");
            }

            await reallocateSurplus(
                sourceFund.id,
                effectiveTargetId,
                amount,
                targetType
            );

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSelectedRec(null);
                setTargetId("");
                onReallocate();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reallocate");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="border-indigo-500/30 bg-indigo-500/5">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-foreground">Smart Surplus Advisor</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            You have <span className="text-indigo-400 font-medium">{formatCurrency(status.surplusEmergency)}</span> in surplus (above 6 months optimal).
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {recommendations.map((rec) => (
                        <Card key={rec.id} className="bg-card border-border hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                            <CardContent className="p-4">
                                <Badge className="mb-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20">
                                    {rec.category === 'loan_prepayment' ? 'Debt Freedom' : 'Grow Wealth'}
                                </Badge>
                                <h4 className="font-semibold text-foreground mb-1">{rec.title}</h4>
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{rec.description}</p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-start gap-2">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-muted-foreground">{rec.impact.financialBenefit}</p>
                                    </div>
                                </div>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            className="w-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                                            onClick={() => {
                                                setSelectedRec(rec);
                                                setReallocateAmount(rec.suggestedAmount.toString());
                                                setTargetId(rec.targetId || "");
                                            }}
                                        >
                                            View Action
                                            <ArrowRightLeft className="w-3.5 h-3.5 ml-2" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <Zap className="w-5 h-5 text-amber-400" />
                                                Optimize Your Surplus
                                            </DialogTitle>
                                            <DialogDescription>
                                                Move money safely from your emergency buffer to higher-growth or debt-reduction goals.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {success ? (
                                            <div className="py-8 flex flex-col items-center text-center">
                                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-medium text-foreground">Reallocation Complete!</h3>
                                                <p className="text-sm text-muted-foreground">Your financial shield is still optimized.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 mt-2">
                                                <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Reallocate Amount</span>
                                                        <span className="font-medium text-foreground">₹{Number(reallocateAmount).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Remaining Surplus</span>
                                                        <span className="font-medium text-indigo-400">
                                                            {formatCurrency(status.surplusEmergency - Number(reallocateAmount))}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Core Shield (Saved)</span>
                                                        <span className="font-medium text-emerald-400">
                                                            {formatCurrency(status.coreEmergency)} (6 months)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm text-muted-foreground">Amount to Reallocate</label>
                                                    <Input
                                                        type="number"
                                                        value={reallocateAmount}
                                                        onChange={(e) => setReallocateAmount(e.target.value)}
                                                        className="bg-secondary border-border"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm text-muted-foreground">Destination</label>
                                                    <Select
                                                        onValueChange={setTargetId}
                                                        defaultValue={rec.targetId}
                                                    >
                                                        <SelectTrigger className="bg-secondary border-border">
                                                            <SelectValue placeholder="Select a goal..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {/* Loans (eligible for loan_prepayment recommendations) */}
                                                            {loans.length > 0 && (
                                                                <>
                                                                    <SelectItem
                                                                        value="__loans_header"
                                                                        disabled
                                                                    >
                                                                        --- Loans (Repayment) ---
                                                                    </SelectItem>
                                                                    {loans.map((loan) => (
                                                                        <SelectItem
                                                                            key={loan.id}
                                                                            value={loan.id}
                                                                        >
                                                                            {loan.name} – Outstanding{" "}
                                                                            {formatCurrency(
                                                                                loan.outstandingAmount
                                                                            )}
                                                                        </SelectItem>
                                                                    ))}
                                                                </>
                                                            )}

                                                            {/* Non-emergency goals */}
                                                            {goals.length > 0 && (
                                                                <>
                                                                    <SelectItem
                                                                        value="__goals_header"
                                                                        disabled
                                                                    >
                                                                        --- Goals (Invest/Save) ---
                                                                    </SelectItem>
                                                                    {goals.map((goal) => (
                                                                        <SelectItem
                                                                            key={goal.id}
                                                                            value={goal.id}
                                                                        >
                                                                            {goal.title} – Target{" "}
                                                                            {formatCurrency(
                                                                                goal.targetAmount
                                                                            )}
                                                                        </SelectItem>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {error && (
                                                    <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 p-2 rounded">
                                                        <AlertCircle className="w-4 h-4" />
                                                        {error}
                                                    </div>
                                                )}

                                                <Button
                                                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                                                    onClick={handleReallocation}
                                                    disabled={submitting || Number(reallocateAmount) <= 0}
                                                >
                                                    {submitting ? "Processing..." : "Confirm Reallocation"}
                                                </Button>
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
