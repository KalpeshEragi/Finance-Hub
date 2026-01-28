"use client";

/**
 * @file emergency-shield-badge.tsx
 * @description Reusable Emergency Shield status component
 * 
 * Shows the user's financial safety shield status in various formats:
 * - Compact: For navbar or small spaces
 * - Card: For dashboard display
 * - Full: For detailed emergency fund page
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Shield,
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    Lock,
    Unlock,
    ArrowRight,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    EmergencyShieldStatus,
    getEmergencyShieldStatus,
    getShieldStatusColor,
    formatCurrency,
} from "@/lib/api/emergency-shield";

// =============================================================================
// TYPES
// =============================================================================

interface EmergencyShieldBadgeProps {
    variant?: "compact" | "card" | "full";
    className?: string;
    showFeatureAccess?: boolean;
}

// =============================================================================
// COMPACT BADGE (for navbar)
// =============================================================================

function CompactBadge({ status }: { status: EmergencyShieldStatus }) {
    const colors = getShieldStatusColor(status.status);
    const ShieldIcon = status.status === "safe" ? ShieldCheck : status.status === "partial" ? Shield : ShieldAlert;

    return (
        <Link href="/dashboard/emergency-fund">
            <Badge
                variant="outline"
                className={cn(
                    "flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-all hover:scale-105",
                    colors.bg,
                    colors.text,
                    colors.border
                )}
            >
                <ShieldIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{status.progressPercentage}%</span>
            </Badge>
        </Link>
    );
}

// =============================================================================
// CARD VARIANT (for dashboard)
// =============================================================================

function CardBadge({ status, showFeatureAccess }: { status: EmergencyShieldStatus; showFeatureAccess?: boolean }) {
    const colors = getShieldStatusColor(status.status);
    const ShieldIcon = status.status === "safe" ? ShieldCheck : status.status === "partial" ? Shield : ShieldAlert;

    return (
        <Card className={cn("bg-gradient-to-br border", colors.gradient, colors.border)}>
            <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", colors.bg)}>
                            <ShieldIcon className={cn("w-5 h-5", colors.text)} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Financial Safety Shield</h3>
                            <p className="text-xs text-muted-foreground">Your Emergency Protection</p>
                        </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", colors.bg, colors.text, colors.border)}>
                        {status.statusLabel}
                    </Badge>
                </div>

                {/* Progress Ring */}
                <div className="flex items-center gap-6 mb-4">
                    <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="34"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                className="text-secondary"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="34"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                strokeDasharray={`${Math.min(status.progressPercentage, 100) * 2.136} 213.6`}
                                strokeLinecap="round"
                                className={colors.text}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={cn("text-xl font-bold", colors.text)}>
                                {status.progressPercentage}%
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Shield</span>
                            <span className="font-medium text-foreground">
                                {formatCurrency(status.totalEmergencyShield)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target (3 months)</span>
                            <span className="font-medium text-foreground">
                                {formatCurrency(status.emergencyTarget)}
                            </span>
                        </div>
                        {status.shortfall > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shortfall</span>
                                <span className="font-medium text-rose-400">
                                    {formatCurrency(status.shortfall)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feature Access (if enabled) */}
                {showFeatureAccess && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className={cn(
                            "flex items-center gap-2 p-2 rounded-lg text-xs",
                            status.featureAccess.canInvest ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground"
                        )}>
                            {status.featureAccess.canInvest ? (
                                <Unlock className="w-3.5 h-3.5" />
                            ) : (
                                <Lock className="w-3.5 h-3.5" />
                            )}
                            Investments
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 p-2 rounded-lg text-xs",
                            status.featureAccess.canPrepayLoans ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground"
                        )}>
                            {status.featureAccess.canPrepayLoans ? (
                                <Unlock className="w-3.5 h-3.5" />
                            ) : (
                                <Lock className="w-3.5 h-3.5" />
                            )}
                            Loan Prepay
                        </div>
                    </div>
                )}

                {/* Action */}
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground max-w-[60%]">
                        {status.status === "safe"
                            ? "You're protected — take smart risks!"
                            : status.recommended.actionText}
                    </p>
                    <Link href="/dashboard/emergency-fund">
                        <Button size="sm" variant="ghost" className={cn("text-xs", colors.text)}>
                            {status.status === "safe" ? "View Details" : "Build Shield"}
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EmergencyShieldBadge({
    variant = "card",
    className,
    showFeatureAccess = true,
}: EmergencyShieldBadgeProps) {
    const [status, setStatus] = useState<EmergencyShieldStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const data = await getEmergencyShieldStatus();
                setStatus(data);
            } catch (err) {
                setError("Failed to load shield status");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchStatus();
    }, []);

    if (loading) {
        if (variant === "compact") {
            return <Skeleton className="w-16 h-6 rounded-full" />;
        }
        return (
            <Card className={cn("bg-card border-border", className)}>
                <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-24 h-3" />
                        </div>
                    </div>
                    <Skeleton className="w-full h-20" />
                </CardContent>
            </Card>
        );
    }

    if (error || !status) {
        return (
            <Card className={cn("bg-card border-border", className)}>
                <CardContent className="p-5 text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                    <p className="text-sm">Could not load shield status</p>
                </CardContent>
            </Card>
        );
    }

    switch (variant) {
        case "compact":
            return <CompactBadge status={status} />;
        case "card":
        default:
            return (
                <div className={className}>
                    <CardBadge status={status} showFeatureAccess={showFeatureAccess} />
                </div>
            );
    }
}

export default EmergencyShieldBadge;
