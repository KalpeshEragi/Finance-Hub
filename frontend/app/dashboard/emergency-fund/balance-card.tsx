import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, EmergencyShieldStatus } from "@/lib/api/emergency-shield";
import { Wallet, Lock, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
    status: EmergencyShieldStatus;
}

export function BalanceCard({ status }: BalanceCardProps) {
    // Calculate percentages for the balance bar
    const totalMoney = status.netBalance;
    // If net balance is 0 or negative (debt), handle gracefully
    const safeTotal = totalMoney > 0 ? totalMoney : 1;
    const allocatedPercent = Math.min((status.allocatedBalance / safeTotal) * 100, 100);
    const freePercent = Math.max(0, 100 - allocatedPercent);

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    YOUR LEDGER BALANCE
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
                <div className="flex flex-col gap-6">

                    {/* Main Balance Display */}
                    <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                        <div>
                            <p className="text-3xl font-bold text-foreground">{formatCurrency(status.netBalance)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Net Worth (Assets - Liabilities)</p>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs mb-0.5">Allocated (Safe)</p>
                                <p className="font-semibold text-blue-400">{formatCurrency(status.allocatedBalance)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs mb-0.5">Free (Spendable)</p>
                                <p className="font-semibold text-emerald-400">{formatCurrency(status.freeBalance)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex">
                            {/* Allocated Portion */}
                            <div
                                className="h-full bg-blue-500/50"
                                style={{ width: `${allocatedPercent}%` }}
                            />
                            {/* Free Portion */}
                            <div
                                className="h-full bg-emerald-500/50"
                                style={{ width: `${freePercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                                Allocated to Goals ({allocatedPercent.toFixed(0)}%)
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                                Free to Allocate ({freePercent.toFixed(0)}%)
                            </span>
                        </div>
                    </div>

                    {/* Contextual Warning if Free Balance is Low */}
                    {status.freeBalance < status.shortfall && status.shortfall > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3">
                            <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-medium text-amber-200">Limited Free Balance</p>
                                <p className="text-xs text-amber-500/80 mt-0.5">
                                    You need {formatCurrency(status.shortfall)} more for your shield, but only have {formatCurrency(status.freeBalance)} free.
                                    You may need to reduce other expenses to fund this.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
