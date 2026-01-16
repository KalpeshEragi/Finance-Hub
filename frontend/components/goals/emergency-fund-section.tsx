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
  ChevronRight,
  PiggyBank,
  IndianRupee,
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
}

interface EmergencyFundSectionProps {
  funds: EmergencyFund[]
  onAddFund: (fund: { name: string; targetAmount: number; monthlyContribution: number }) => void
  onContribute: (fundId: string, amount: number) => void
  onDeleteFund: (fundId: string) => void
}

export function EmergencyFundSection({ funds, onAddFund, onContribute, onDeleteFund }: EmergencyFundSectionProps) {
  const [showAddFund, setShowAddFund] = useState(false)
  const [showContribute, setShowContribute] = useState<string | null>(null)
  const [newFund, setNewFund] = useState({ name: "", targetAmount: "", monthlyContribution: "" })
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

  const handleAddFund = () => {
    if (newFund.name && newFund.targetAmount && newFund.monthlyContribution) {
      onAddFund({
        name: newFund.name,
        targetAmount: Number.parseFloat(newFund.targetAmount),
        monthlyContribution: Number.parseFloat(newFund.monthlyContribution),
      })
      setNewFund({ name: "", targetAmount: "", monthlyContribution: "" })
      setShowAddFund(false)
    }
  }

  const handleContribute = (fundId: string) => {
    if (contributeAmount && Number.parseFloat(contributeAmount) > 0) {
      onContribute(fundId, Number.parseFloat(contributeAmount))
      setContributeAmount("")
      setShowContribute(null)
    }
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
    <div className="mt-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Emergency Fund</h2>
            <p className="text-sm text-muted-foreground">Build your financial safety net</p>
          </div>
        </div>
        <Dialog open={showAddFund} onOpenChange={setShowAddFund}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Fund
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Create Emergency Fund
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Set up a new emergency fund to build your financial safety net
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
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
                <p className="text-xs text-muted-foreground">Recommended: 3-6 months of expenses</p>
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
                  <p className="text-xs text-primary">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <p className="text-xs text-muted-foreground mt-1.5">of ₹{totalTarget.toLocaleString("en-IN")} target</p>
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
              Started on{" "}
              {earliestStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground">Monthly Contribution</span>
            </div>
            <p className="text-3xl font-bold text-foreground">₹{totalMonthly.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Across {funds.length} fund{funds.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Funds Grid */}
      {funds.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-amber-500/10 mb-4">
              <Shield className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Emergency Funds Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Start building your financial safety net. Experts recommend saving 3-6 months of expenses for emergencies.
            </p>
            <Button
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
              onClick={() => setShowAddFund(true)}
            >
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
                        <Shield className="w-6 h-6 text-amber-400" />
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
                        <DropdownMenuItem className="text-destructive" onClick={() => onDeleteFund(fund.id)}>
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
                        <p className="text-lg text-muted-foreground">₹{fund.targetAmount.toLocaleString("en-IN")}</p>
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
                          <Shield className="w-5 h-5 text-amber-400" />
                          Contribute to {fund.name}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          ₹{(fund.targetAmount - fund.savedAmount).toLocaleString("en-IN")} remaining to reach your goal
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
                          <label className="text-sm text-muted-foreground">Custom amount</label>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={contributeAmount}
                            onChange={(e) => setContributeAmount(e.target.value)}
                            className="bg-secondary border-border text-foreground text-lg"
                          />
                        </div>

                        {/* Preview */}
                        {contributeAmount && Number.parseFloat(contributeAmount) > 0 && (
                          <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                            <p className="text-sm text-muted-foreground mb-2">After this contribution:</p>
                            <div className="flex justify-between items-center">
                              <span className="text-foreground font-medium">
                                ₹{(fund.savedAmount + Number.parseFloat(contributeAmount)).toLocaleString("en-IN")}
                              </span>
                              <span className="text-amber-400 font-medium">
                                {Math.min(
                                  ((fund.savedAmount + Number.parseFloat(contributeAmount)) / fund.targetAmount) * 100,
                                  100,
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
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

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 border-border bg-transparent"
                            onClick={() => setShowContribute(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => handleContribute(fund.id)}
                            disabled={!contributeAmount || Number.parseFloat(contributeAmount) <= 0}
                          >
                            Add ₹{contributeAmount ? Number.parseFloat(contributeAmount).toLocaleString("en-IN") : "0"}
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

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Why Emergency Funds Matter</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Financial experts recommend having 3-6 months of expenses saved for unexpected situations like medical
                emergencies, job loss, or urgent repairs.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-secondary/50 border-border text-muted-foreground">
                  Medical emergencies
                </Badge>
                <Badge variant="outline" className="bg-secondary/50 border-border text-muted-foreground">
                  Job loss buffer
                </Badge>
                <Badge variant="outline" className="bg-secondary/50 border-border text-muted-foreground">
                  Car/home repairs
                </Badge>
                <Badge variant="outline" className="bg-secondary/50 border-border text-muted-foreground">
                  Family emergencies
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-400 shrink-0">
              Learn more <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
