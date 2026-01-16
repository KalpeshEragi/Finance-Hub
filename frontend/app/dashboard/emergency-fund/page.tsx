"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Shield,
  Plus,
  Calendar,
  TrendingUp,
  Wallet,
  Clock,
  MoreHorizontal,
  Sparkles,
  AlertTriangle,
  PiggyBank,
  IndianRupee,
  History,
  Lightbulb,
  ArrowUpRight,
  Heart,
  Home,
  Briefcase,
  Car,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmergencyFund {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  monthlyContribution: number
  startDate: Date
  lastContribution: Date | null
  contributions: { date: Date; amount: number }[]
  icon: string
}

const initialFunds: EmergencyFund[] = [
  {
    id: "ef1",
    name: "Medical Emergency",
    targetAmount: 300000,
    savedAmount: 175000,
    monthlyContribution: 15000,
    startDate: new Date(2025, 3, 1),
    lastContribution: new Date(2026, 0, 10),
    icon: "medical",
    contributions: [
      { date: new Date(2026, 0, 10), amount: 15000 },
      { date: new Date(2025, 11, 10), amount: 15000 },
      { date: new Date(2025, 10, 10), amount: 15000 },
      { date: new Date(2025, 9, 10), amount: 15000 },
      { date: new Date(2025, 8, 10), amount: 15000 },
    ],
  },
  {
    id: "ef2",
    name: "Job Loss Fund",
    targetAmount: 500000,
    savedAmount: 225000,
    monthlyContribution: 20000,
    startDate: new Date(2025, 6, 1),
    lastContribution: new Date(2026, 0, 5),
    icon: "job",
    contributions: [
      { date: new Date(2026, 0, 5), amount: 20000 },
      { date: new Date(2025, 11, 5), amount: 20000 },
      { date: new Date(2025, 10, 5), amount: 20000 },
    ],
  },
  {
    id: "ef3",
    name: "Home Repairs",
    targetAmount: 200000,
    savedAmount: 85000,
    monthlyContribution: 10000,
    startDate: new Date(2025, 9, 1),
    lastContribution: new Date(2026, 0, 8),
    icon: "home",
    contributions: [
      { date: new Date(2026, 0, 8), amount: 10000 },
      { date: new Date(2025, 11, 8), amount: 10000 },
    ],
  },
]

const fundIcons = {
  medical: Heart,
  job: Briefcase,
  home: Home,
  vehicle: Car,
  general: Shield,
}

const iconOptions = [
  { value: "medical", label: "Medical", icon: Heart },
  { value: "job", label: "Job Loss", icon: Briefcase },
  { value: "home", label: "Home", icon: Home },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "general", label: "General", icon: Shield },
]

export default function EmergencyFundPage() {
  const [funds, setFunds] = useState<EmergencyFund[]>(initialFunds)
  const [showAddFund, setShowAddFund] = useState(false)
  const [showContribute, setShowContribute] = useState<string | null>(null)
  const [newFund, setNewFund] = useState({ name: "", targetAmount: "", monthlyContribution: "", icon: "general" })
  const [contributeAmount, setContributeAmount] = useState("")

  // Calculate totals
  const totalSaved = funds.reduce((sum, f) => sum + f.savedAmount, 0)
  const totalTarget = funds.reduce((sum, f) => sum + f.targetAmount, 0)
  const totalMonthly = funds.reduce((sum, f) => sum + f.monthlyContribution, 0)

  // Calculate duration since earliest start date
  const earliestStart = funds.length > 0 ? new Date(Math.min(...funds.map((f) => f.startDate.getTime()))) : new Date()
  const daysSaving = Math.floor((new Date().getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24))
  const monthsSaving = Math.floor(daysSaving / 30)
  const yearsSaving = Math.floor(monthsSaving / 12)
  const remainingMonths = monthsSaving % 12

  const formatDuration = () => {
    if (yearsSaving > 0) {
      return `${yearsSaving} year${yearsSaving > 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
    }
    if (monthsSaving > 0) {
      return `${monthsSaving} month${monthsSaving > 1 ? "s" : ""}`
    }
    return `${daysSaving} day${daysSaving !== 1 ? "s" : ""}`
  }

  // Get all contributions across funds for history
  const allContributions = funds
    .flatMap((fund) =>
      fund.contributions.map((c) => ({
        fundId: fund.id,
        fundName: fund.name,
        fundIcon: fund.icon,
        amount: c.amount,
        date: c.date,
      })),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)

  const handleAddFund = () => {
    if (newFund.name && newFund.targetAmount && newFund.monthlyContribution) {
      const fund: EmergencyFund = {
        id: `ef-${Date.now()}`,
        name: newFund.name,
        targetAmount: Number.parseFloat(newFund.targetAmount),
        savedAmount: 0,
        monthlyContribution: Number.parseFloat(newFund.monthlyContribution),
        startDate: new Date(),
        lastContribution: null,
        icon: newFund.icon,
        contributions: [],
      }
      setFunds([...funds, fund])
      setNewFund({ name: "", targetAmount: "", monthlyContribution: "", icon: "general" })
      setShowAddFund(false)
    }
  }

  const handleContribute = (fundId: string) => {
    if (contributeAmount && Number.parseFloat(contributeAmount) > 0) {
      setFunds(
        funds.map((fund) => {
          if (fund.id === fundId) {
            return {
              ...fund,
              savedAmount: Math.min(fund.savedAmount + Number.parseFloat(contributeAmount), fund.targetAmount),
              lastContribution: new Date(),
              contributions: [...fund.contributions, { date: new Date(), amount: Number.parseFloat(contributeAmount) }],
            }
          }
          return fund
        }),
      )
      setContributeAmount("")
      setShowContribute(null)
    }
  }

  const handleDeleteFund = (fundId: string) => {
    setFunds(funds.filter((f) => f.id !== fundId))
  }

  const getHealthStatus = (fund: EmergencyFund) => {
    const progress = (fund.savedAmount / fund.targetAmount) * 100
    if (progress >= 100)
      return {
        label: "Fully Funded",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: Sparkles,
      }
    if (progress >= 75)
      return { label: "Almost There", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: TrendingUp }
    if (progress >= 50)
      return { label: "Good Progress", color: "bg-primary/20 text-primary border-primary/30", icon: Shield }
    if (progress >= 25)
      return { label: "Building", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: PiggyBank }
    return {
      label: "Just Started",
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      icon: AlertTriangle,
    }
  }

  const quickAmounts = [1000, 2500, 5000, 10000]

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Emergency Fund</h1>
            <p className="text-sm text-muted-foreground">Build your financial safety net for unexpected expenses</p>
          </div>
        </div>
        <Dialog open={showAddFund} onOpenChange={setShowAddFund}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
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
              <DialogDescription className="text-muted-foreground">
                Set up a new emergency fund to protect yourself from unexpected expenses
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Icon Selection */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Fund Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewFund({ ...newFund, icon: option.value })}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                          newFund.icon === option.value
                            ? "bg-amber-500/20 border-amber-500 text-amber-400"
                            : "bg-secondary border-border text-muted-foreground hover:border-amber-500/50",
                        )}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-xs">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Fund Name</label>
                <Input
                  placeholder="e.g., Medical Emergency, Job Loss Fund"
                  value={newFund.name}
                  onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Target Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g., 300000"
                  value={newFund.targetAmount}
                  onChange={(e) => setNewFund({ ...newFund, targetAmount: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">Recommended: 3-6 months of your monthly expenses</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Monthly Contribution (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g., 10000"
                  value={newFund.monthlyContribution}
                  onChange={(e) => setNewFund({ ...newFund, monthlyContribution: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
                {newFund.targetAmount && newFund.monthlyContribution && (
                  <p className="text-xs text-amber-400">
                    You'll reach your goal in approximately{" "}
                    {Math.ceil(
                      Number.parseFloat(newFund.targetAmount) / Number.parseFloat(newFund.monthlyContribution),
                    )}{" "}
                    months
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 border-border bg-transparent"
                  onClick={() => setShowAddFund(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleAddFund}
                  disabled={!newFund.name || !newFund.targetAmount || !newFund.monthlyContribution}
                >
                  Create Fund
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Wallet className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-muted-foreground">Total Saved</span>
            </div>
            <p className="text-3xl font-bold text-foreground">₹{totalSaved.toLocaleString("en-IN")}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-muted-foreground">Saving Duration</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatDuration()}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Started {earliestStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground">Monthly Total</span>
            </div>
            <p className="text-3xl font-bold text-foreground">₹{totalMonthly.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Across {funds.length} fund{funds.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-muted-foreground">Remaining</span>
            </div>
            <p className="text-3xl font-bold text-foreground">₹{(totalTarget - totalSaved).toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-2">of ₹{totalTarget.toLocaleString("en-IN")} target</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funds Grid - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Emergency Funds</h2>

          {funds.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-amber-500/10 mb-4">
                  <Shield className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No Emergency Funds Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  Start building your financial safety net. Experts recommend saving 3-6 months of expenses for
                  emergencies.
                </p>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowAddFund(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Fund
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funds.map((fund) => {
                const progress = (fund.savedAmount / fund.targetAmount) * 100
                const status = getHealthStatus(fund)
                const StatusIcon = status.icon
                const FundIcon = fundIcons[fund.icon as keyof typeof fundIcons] || Shield
                const monthsToGoal =
                  fund.monthlyContribution > 0
                    ? Math.ceil((fund.targetAmount - fund.savedAmount) / fund.monthlyContribution)
                    : 0

                return (
                  <Card
                    key={fund.id}
                    className="bg-card border-border hover:border-amber-500/30 transition-all duration-200 group"
                  >
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <FundIcon className="w-6 h-6 text-amber-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{fund.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn("text-xs border", status.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem>Edit fund</DropdownMenuItem>
                            <DropdownMenuItem>View history</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFund(fund.id)}>
                              Delete fund
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Saved</p>
                            <p className="text-2xl font-bold text-foreground">
                              ₹{fund.savedAmount.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Target</p>
                            <p className="text-lg text-muted-foreground">
                              ₹{fund.targetAmount.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <p className="text-xs text-muted-foreground">{progress.toFixed(1)}% funded</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{(fund.targetAmount - fund.savedAmount).toLocaleString("en-IN")} remaining
                          </p>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Monthly</span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            ₹{fund.monthlyContribution.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Time to Goal</span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {progress >= 100 ? "Complete!" : `${monthsToGoal} month${monthsToGoal !== 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>

                      {/* Contribute Button */}
                      <Dialog
                        open={showContribute === fund.id}
                        onOpenChange={(open) => setShowContribute(open ? fund.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contribution
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle className="text-foreground flex items-center gap-2">
                              <FundIcon className="w-5 h-5 text-amber-400" />
                              Contribute to {fund.name}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              ₹{(fund.targetAmount - fund.savedAmount).toLocaleString("en-IN")} remaining to reach your
                              goal
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            {/* Quick Amount Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                              {quickAmounts.map((amount) => (
                                <Button
                                  key={amount}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "border-border",
                                    contributeAmount === amount.toString() && "bg-amber-500/20 border-amber-500",
                                  )}
                                  onClick={() => setContributeAmount(amount.toString())}
                                >
                                  ₹{amount >= 1000 ? `${amount / 1000}K` : amount}
                                </Button>
                              ))}
                            </div>

                            {/* Custom Amount */}
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Custom Amount</label>
                              <Input
                                type="number"
                                placeholder="Enter amount"
                                value={contributeAmount}
                                onChange={(e) => setContributeAmount(e.target.value)}
                                className="bg-secondary border-border text-foreground"
                              />
                            </div>

                            {/* Preview */}
                            {contributeAmount && Number.parseFloat(contributeAmount) > 0 && (
                              <div className="bg-secondary/50 rounded-lg p-4">
                                <p className="text-sm text-muted-foreground mb-2">After this contribution:</p>
                                <div className="flex justify-between items-center">
                                  <span className="text-foreground font-medium">New Total</span>
                                  <span className="text-lg font-bold text-amber-400">
                                    ₹
                                    {Math.min(
                                      fund.savedAmount + Number.parseFloat(contributeAmount),
                                      fund.targetAmount,
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <div className="h-2 bg-background rounded-full mt-2 overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        ((fund.savedAmount + Number.parseFloat(contributeAmount)) / fund.targetAmount) *
                                          100,
                                        100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex gap-3 mt-2">
                              <Button
                                variant="outline"
                                className="flex-1 border-border bg-transparent"
                                onClick={() => {
                                  setContributeAmount("")
                                  setShowContribute(null)
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                                onClick={() => handleContribute(fund.id)}
                                disabled={!contributeAmount || Number.parseFloat(contributeAmount) <= 0}
                              >
                                Add ₹
                                {contributeAmount ? Number.parseFloat(contributeAmount).toLocaleString("en-IN") : 0}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-4">
          {/* Recent Contributions */}
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  Recent Contributions
                </h3>
              </div>
              <div className="space-y-3">
                {allContributions.slice(0, 5).map((contribution, index) => {
                  const ContribIcon = fundIcons[contribution.fundIcon as keyof typeof fundIcons] || Shield
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <ContribIcon className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{contribution.fundName}</p>
                          <p className="text-xs text-muted-foreground">
                            {contribution.date.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-emerald-400">
                        +₹{contribution.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )
                })}
              </div>
              {allContributions.length > 5 && (
                <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-foreground">
                  View All History
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-foreground">Emergency Fund Tips</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Aim for <span className="text-foreground">3-6 months</span> of essential expenses
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Keep funds in a <span className="text-foreground">liquid savings account</span> for quick access
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground">Automate</span> monthly contributions for consistency
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Only use for <span className="text-foreground">true emergencies</span> - not planned expenses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
