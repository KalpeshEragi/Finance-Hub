"use client";

/**
 * @file emergency-fund/page.tsx
 * @description Emergency Fund Safety Shield page (Ledger-Correct Two-Tier System)
 * 
 * Shows:
 * 1. Ledger Balance (Net vs Allocated vs Free)
 * 2. Shield Status (Core Locked vs Surplus Flexible)
 * 3. Feature Access Permissions
 * 4. Surplus Recommendations (if >6 months)
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  TrendingUp,
  Wallet,
  Clock,
  AlertTriangle,
  Heart,
  Home,
  Briefcase,
  Car,
  Target,
  Sparkles,
  Lock as LockIcon,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EmergencyShieldStatus,
  getEmergencyShieldStatus,
  createEmergencyFund,
  contributeToFund,
  getShieldStatusColor,
  formatCurrency,
  CreateEmergencyFundInput,
  getSurplusRecommendations,
  SurplusRecommendation,
  reallocateWithinEmergency,
} from "@/lib/api/emergency-shield";

// New Components
import { BalanceCard } from "./balance-card";
import { SurplusPanel } from "./surplus-panel";

// =============================================================================
// ICON MAPPING
// =============================================================================

const fundIcons = {
  medical: Heart,
  job_loss: Briefcase,
  home: Home,
  vehicle: Car,
  general: Shield,
};

const iconOptions = [
  { value: "medical", label: "Medical", icon: Heart },
  { value: "job_loss", label: "Job Loss", icon: Briefcase },
  { value: "home", label: "Home", icon: Home },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "general", label: "General", icon: Shield },
] as const;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function EmergencyFundPage() {
  const [shieldStatus, setShieldStatus] = useState<EmergencyShieldStatus | null>(null);
  const [surplusRecs, setSurplusRecs] = useState<SurplusRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [showAddFund, setShowAddFund] = useState(false);
  const [showContribute, setShowContribute] = useState<string | null>(null);

  // Form States
  const [newFund, setNewFund] = useState<CreateEmergencyFundInput>({
    name: "",
    targetAmount: 0,
    type: "general",
  });
  const [contributeAmount, setContributeAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [contributeError, setContributeError] = useState<string | null>(null);

  // Global "Add from Free Balance → Emergency Fund" form
  const [globalFundId, setGlobalFundId] = useState<string | null>(null);
  const [globalAmount, setGlobalAmount] = useState("");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSubmitting, setGlobalSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getEmergencyShieldStatus();
      setShieldStatus(data);

      // Load surplus recommendations if applicable
      if (data.hasSurplus) {
        const recs = await getSurplusRecommendations();
        setSurplusRecs(recs);
      } else {
        setSurplusRecs([]);
      }

      setError(null);
    } catch (err) {
      setError("Failed to load emergency shield status");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle re-fetch without full loading state
  async function refreshData() {
    const data = await getEmergencyShieldStatus();
    setShieldStatus(data);
    if (data.hasSurplus) {
      const recs = await getSurplusRecommendations();
      setSurplusRecs(recs);
    } else {
      setSurplusRecs([]);
    }
  }

  // Create new fund
  async function handleAddFund() {
    if (!newFund.name || !newFund.targetAmount) return;

    try {
      setSubmitting(true);
      await createEmergencyFund(newFund);
      await refreshData();
      setNewFund({ name: "", targetAmount: 0, type: "general" });
      setShowAddFund(false);
    } catch (err) {
      console.error("Failed to create fund:", err);
    } finally {
      setSubmitting(false);
    }
  }

  // Per-fund internal redistribution (Emergency → Emergency)
  async function handleContribute(fundId: string) {
    if (!shieldStatus) return;
    if (!contributeAmount || Number(contributeAmount) <= 0) return;

    const amount = Number(contributeAmount);

    // Choose a source emergency fund different from the target.
    const sourceFund = shieldStatus.emergencyFunds
      .filter((f) => f.id !== fundId)
      .sort((a, b) => b.currentAmount - a.currentAmount)[0];

    if (!sourceFund) {
      setContributeError("You need at least one other emergency fund to reallocate from.");
      return;
    }

    if (amount > sourceFund.currentAmount) {
      setContributeError(
        `You can move up to ${formatCurrency(
          sourceFund.currentAmount
        )} from ${sourceFund.name} into this fund.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setContributeError(null);
      const result = await reallocateWithinEmergency(sourceFund.id, fundId, amount);
      setShieldStatus(result.shieldStatus);
      setContributeAmount("");
      setShowContribute(null);
      await refreshData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to redistribute emergency allocations";
      setContributeError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Global Add from Free Balance → Emergency Fund
  async function handleGlobalAdd() {
    if (!shieldStatus) return;
    if (!globalFundId) {
      setGlobalError("Please select an emergency fund");
      return;
    }
    const amount = Number(globalAmount);
    if (!amount || amount <= 0) {
      setGlobalError("Enter a positive amount");
      return;
    }

    // Validate against available free balance and backend maxContribution hint
    const maxAllowed = Math.min(
      shieldStatus.freeBalance,
      shieldStatus.maxContribution || shieldStatus.freeBalance
    );
    if (amount > maxAllowed) {
      setGlobalError(
        `You can allocate up to ${formatCurrency(
          maxAllowed
        )} from your Free Balance into emergency funds.`
      );
      return;
    }

    try {
      setGlobalSubmitting(true);
      setGlobalError(null);
      const result = await contributeToFund(globalFundId, amount);
      setShieldStatus(result.shieldStatus);
      setGlobalAmount("");
      // keep selected fund
      await refreshData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add to emergency fund";
      setGlobalError(message);
    } finally {
      setGlobalSubmitting(false);
    }
  }

  // Load Skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-64 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="w-full h-32 rounded-xl" />
            <Skeleton className="w-full h-96 rounded-xl" />
          </div>
          <Skeleton className="w-full h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error State
  if (error || !shieldStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Could Not Load Shield Status</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadData}>Try Again</Button>
      </div>
    );
  }

  const colors = getShieldStatusColor(shieldStatus.status);
  const ShieldIcon = shieldStatus.status === "safe" ? ShieldCheck : shieldStatus.status === "partial" ? Shield : ShieldAlert;
  const quickAmounts = [1000, 2500, 5000, 10000];

  // Two-Tier Logic for Display
  const isFullyProtected = shieldStatus.coreProgressPercentage >= 100;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-xl", colors.bg)}>
            <ShieldIcon className={cn("w-8 h-8", colors.text)} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Financial Safety Shield</h1>
            <p className="text-sm text-muted-foreground">
              {shieldStatus.status === "safe"
                ? "You're protected — maintain your core shield or grow wealth"
                : "Build your safety net before taking financial risks"}
            </p>
          </div>
        </div>

        <Dialog open={showAddFund} onOpenChange={setShowAddFund}>
          <DialogTrigger asChild>
            <Button className={cn(colors.bg, colors.text, "border", colors.border, "hover:opacity-90")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Fund
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Create Emergency Fund
              </DialogTitle>
              <DialogDescription>
                Build your financial safety shield with a new emergency fund
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Fund Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewFund({ ...newFund, type: option.value })}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                          newFund.type === option.value
                            ? cn(colors.bg, colors.border, colors.text)
                            : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-xs">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Fund Name</label>
                <Input
                  placeholder="e.g., Medical Emergency"
                  value={newFund.name}
                  onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Target Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g., 300000"
                  value={newFund.targetAmount || ""}
                  onChange={(e) => setNewFund({ ...newFund, targetAmount: Number(e.target.value) })}
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: {formatCurrency(shieldStatus.emergencyTarget)} (3 months)
                </p>
              </div>
              <Button onClick={handleAddFund} disabled={submitting} className="w-full mt-4">
                {submitting ? "Creating..." : "Create Fund"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Shield Status Card (Core Visualization) */}
          <Card className={cn("bg-gradient-to-br border", colors.gradient, colors.border)}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">

                {/* Ring Chart */}
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-secondary opacity-30" />
                      {/* Core Progress (up to optimal) */}
                      <circle
                        cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none"
                        strokeDasharray={`${Math.min(shieldStatus.coreProgressPercentage, 100) * 3.52} 352`}
                        strokeLinecap="round"
                        className={colors.text}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn("text-2xl font-bold", colors.text)}>
                        {Math.min(shieldStatus.coreProgressPercentage, 100)}%
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Core Safe</span>
                    </div>
                  </div>
                  <div>
                    <Badge variant="outline" className={cn("text-sm mb-2", colors.bg, colors.text, colors.border)}>
                      {shieldStatus.statusLabel}
                    </Badge>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(shieldStatus.coreEmergency)}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        / {formatCurrency(shieldStatus.emergencyOptimal)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Core Emergency funds (locked)</p>
                  </div>
                </div>

                {/* Two-Tier Stats */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="bg-background/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <LockIcon className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">3-Month Min</span>
                    </div>
                    <p className="font-semibold text-foreground">{formatCurrency(shieldStatus.emergencyTarget)}</p>
                  </div>
                  <div className="bg-background/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-muted-foreground">6-Month Optimal</span>
                    </div>
                    <p className="font-semibold text-foreground">{formatCurrency(shieldStatus.emergencyOptimal)}</p>
                  </div>
                  <div className="bg-background/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span className="text-xs text-muted-foreground">Surplus (Flexible)</span>
                    </div>
                    <p className={cn("font-semibold", shieldStatus.surplusEmergency > 0 ? "text-indigo-400" : "text-muted-foreground")}>
                      {formatCurrency(shieldStatus.surplusEmergency)}
                    </p>
                  </div>
                  <div className="bg-background/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Safety Runway</span>
                    </div>
                    <p className="font-semibold text-foreground">
                      {(shieldStatus.totalEmergencyShield / shieldStatus.monthlyEssentialExpenses).toFixed(1)} Months
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendation Text */}
              {shieldStatus.status !== "safe" && (
                <div className="mt-4 p-3 bg-background/30 rounded-lg border border-white/5">
                  <p className="text-sm font-medium">💡 {shieldStatus.recommended.priorityMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Ledger Balance Summary (New) */}
          <BalanceCard status={shieldStatus} />

          {/* 2b. Add from Free Balance → Emergency Fund */}
          {shieldStatus.freeBalance > 0 && shieldStatus.emergencyFunds.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Add from Free Balance to Emergency Fund
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Move money from your spendable balance into a protected emergency
                      envelope.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Free Balance</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(shieldStatus.freeBalance)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Emergency Fund
                    </label>
                    <select
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                      value={globalFundId || ""}
                      onChange={(e) => setGlobalFundId(e.target.value || null)}
                    >
                      <option value="">Select fund…</option>
                      {shieldStatus.emergencyFunds.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                          {fund.name} ({formatCurrency(fund.currentAmount)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Amount (₹)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g., 5000"
                      value={globalAmount}
                      onChange={(e) => setGlobalAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full mt-4 md:mt-0"
                      onClick={handleGlobalAdd}
                      disabled={globalSubmitting}
                    >
                      {globalSubmitting ? "Allocating..." : "Add to Emergency"}
                    </Button>
                    {globalError && (
                      <p className="text-xs text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {globalError}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Surplus Panel (Conditional) */}
          <SurplusPanel status={shieldStatus} recommendations={surplusRecs} onReallocate={refreshData} />

          {/* 4. Funds Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Emergency Allocations</h2>
            {shieldStatus.emergencyFunds.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl">
                <p className="text-muted-foreground mb-4">No funds yet. Start building your shield.</p>
                <Button onClick={() => setShowAddFund(true)}>Create First Fund</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shieldStatus.emergencyFunds.map((fund) => {
                  const FundIcon = fundIcons[fund.type] || Shield;
                  return (
                    <Card key={fund.id} className="bg-card border-border hover:border-primary/20 transition-all">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-secondary text-foreground">
                              <FundIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{fund.name}</p>
                              <p className="text-xs text-muted-foreground">{fund.progressPercentage.toFixed(0)}% Funded</p>
                            </div>
                          </div>
                          <Dialog open={showContribute === fund.id} onOpenChange={(open) => setShowContribute(open ? fund.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8">
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px]">
                              <DialogHeader>
                                <DialogTitle>Reallocate to {fund.name}</DialogTitle>
                                <DialogDescription>
                                  Move money from another emergency fund into this envelope. Net balance and total
                                  emergency pool stay the same.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-4 gap-2">
                                  {quickAmounts.map(amt => (
                                    <Button key={amt} variant="outline" size="sm" onClick={() => setContributeAmount(amt.toString())}>
                                      ₹{amt / 1000}k
                                    </Button>
                                  ))}
                                </div>
                                <Input
                                  type="number"
                                  placeholder="Custom Amount"
                                  value={contributeAmount}
                                  onChange={(e) => setContributeAmount(e.target.value)}
                                />
                                {contributeError && (
                                  <p className="text-sm text-rose-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> {contributeError}
                                  </p>
                                )}
                                <Button onClick={() => handleContribute(fund.id)} disabled={submitting} className="w-full">
                                  {submitting ? "Allocating..." : "Confirm Allocation"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current</span>
                            <span className="font-medium">{formatCurrency(fund.currentAmount)}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(fund.progressPercentage, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Target: {formatCurrency(fund.targetAmount)}</span>
                            <span>{Math.max(0, fund.targetAmount - fund.currentAmount) === 0 ? "Completed" : "In Progress"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Feature Access */}
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <LockIcon className="w-4 h-4 text-muted-foreground" />
                Feature Access
              </h3>
              <div className="space-y-3">
                <div className={cn("flex items-center justify-between p-2 rounded-lg text-sm", shieldStatus.featureAccess.canInvest ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                  <span>Investments</span>
                  {shieldStatus.featureAccess.canInvest ? <ShieldCheck className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                </div>
                <div className={cn("flex items-center justify-between p-2 rounded-lg text-sm", shieldStatus.featureAccess.canPrepayLoans ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                  <span>Loan Prepayments</span>
                  {shieldStatus.featureAccess.canPrepayLoans ? <ShieldCheck className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                </div>
                <div className={cn("flex items-center justify-between p-2 rounded-lg text-sm", shieldStatus.featureAccess.canAllocateToNonEmergencyGoals ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                  <span>Other Goals</span>
                  {shieldStatus.featureAccess.canAllocateToNonEmergencyGoals ? <ShieldCheck className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-border">
            <CardContent className="p-5 text-sm space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Smart Two-Tier Strategy
              </h4>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Core Shield (3-6mo):</strong> Locked for survival expenses. This determines your safety status.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Surplus Shield ({">"}6mo):</strong> Flexible buffer that can be reallocated to investments or debt payoff.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
