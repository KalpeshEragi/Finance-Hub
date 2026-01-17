"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Receipt,
  AlertCircle,
  IndianRupee,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Plus,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getTaxEstimate,
  getTaxDeductions,
  updateTaxIncome,
  type TaxComparison,
  type IncomeInput
} from "@/lib/api/tax"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ITRFormSuggester } from "@/components/tax/itr-form-suggester"
import { TaxPlannerWizard } from "@/components/tax/tax-planner-wizard"
import { TaxDeadlines } from "@/components/tax/tax-deadlines"
import { TaxSummaryChart } from "@/components/tax/tax-summary-chart"

export default function TaxPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [comparison, setComparison] = useState<TaxComparison | null>(null)
  const [deductionsData, setDeductionsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  // Income form state
  const [incomeType, setIncomeType] = useState<IncomeInput['type']>('salary')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomePeriod, setIncomePeriod] = useState<IncomeInput['period']>('annually')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [estRes, dedRes] = await Promise.all([
        getTaxEstimate(),
        getTaxDeductions()
      ])
      setComparison(estRes.data)
      setDeductionsData(dedRes.data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tax data",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateIncome = async () => {
    if (!incomeAmount) return
    setIsUpdating(true)
    try {
      await updateTaxIncome({
        type: incomeType,
        amount: parseFloat(incomeAmount),
        period: incomePeriod
      })
      toast({ title: "Success", description: "Income updated successfully" })
      fetchData()
      setIncomeAmount('')
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update income" })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading && !comparison) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Calculating your tax estimates...</p>
      </div>
    )
  }

  if (!comparison) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-10 h-10 text-destructive mb-4" />
        <p className="text-muted-foreground">Unable to load tax data. Please try again later.</p>
        <Button onClick={fetchData} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const recommended = comparison.recommended === 'old' ? comparison.oldRegime : comparison.newRegime

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Receipt className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tax Center</h1>
            <p className="text-sm text-muted-foreground">
              Comprehensive tax planning and regime optimization
            </p>
          </div>
        </div>
        <div className="flex flex-row-reverse sm:flex-row items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <TaxPlannerWizard
            trigger={
              <Button className="bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-semibold h-9">
                <Sparkles className="w-4 h-4 mr-2" />
                Plan My Taxes
              </Button>
            }
            onComplete={() => fetchData()}
          />

          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 w-fit shrink-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            FY 2025-26
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border p-1 h-12">
          <TabsTrigger value="overview" className="h-10 px-6 data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="income" className="h-10 px-6 data-[state=active]:bg-background">Income & Deductions</TabsTrigger>
          <TabsTrigger value="comparison" className="h-10 px-6 data-[state=active]:bg-background">Regime Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Main Recommendation Card */}
              {recommended?.grossIncome > 0 ? (
                <Card className="bg-gradient-to-br from-primary/10 to-blue-600/10 border-primary/20">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          <span className="text-sm font-medium uppercase tracking-wider text-primary">AI Recommendation</span>
                        </div>
                        <h2 className="text-3xl font-bold text-foreground">
                          Switch to the <span className="text-primary capitalize">{comparison?.recommended} Regime</span>
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                          {comparison?.explanation}
                        </p>
                        <div className="flex items-center gap-6 pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase mb-1">Estimated Tax</p>
                            <p className="text-2xl font-bold text-foreground">₹{(recommended?.totalTax ?? 0).toLocaleString()}</p>
                          </div>
                          <div className="w-px h-10 bg-border" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase mb-1">Potential Savings</p>
                            <p className="text-2xl font-bold text-emerald-400">₹{(comparison?.savings ?? 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-48 h-48 rounded-full border-8 border-primary/20 flex flex-col items-center justify-center bg-background/50 relative">
                        <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent animate-[spin_3s_linear_infinite]" />
                        <span className="text-xs text-muted-foreground">Effective Rate</span>
                        <span className="text-2xl font-bold">{recommended?.effectiveTaxRate ?? 0}%</span>
                        <Badge variant="outline" className="mt-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Optimal</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/20">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">No Income Data Yet</h2>
                      <p className="text-muted-foreground max-w-md">
                        To get personalized tax recommendations, please add your income details or use the Tax Planner Wizard.
                      </p>
                      <div className="flex gap-3 mt-2">
                        <TaxPlannerWizard
                          trigger={
                            <Button className="bg-gradient-to-r from-primary to-blue-600">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Start Tax Planner
                            </Button>
                          }
                          onComplete={() => fetchData()}
                        />
                        <Button variant="outline" onClick={() => setActiveTab('income')}>
                          Enter Income Manually
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Charts & Visual Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaxSummaryChart comparison={comparison} />

                {/* Comparison Card (Simplified) */}
                <Card className="bg-card border-border flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">Tax Regime Breakdown</CardTitle>
                    <CardDescription>Detailed numbers comparison</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg border border-border bg-secondary/20 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Old Regime Tax</p>
                          <p className="text-xs text-muted-foreground w-[180px] break-words">Incl. deductions</p>
                        </div>
                        <p className="text-lg font-bold">₹{(comparison?.oldRegime.totalTax ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-secondary/20 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">New Regime Tax</p>
                          <p className="text-xs text-muted-foreground">Flat rates</p>
                        </div>
                        <p className="text-lg font-bold">₹{(comparison?.newRegime.totalTax ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-emerald-500">Net Savings</span>
                          <span className="text-2xl font-black text-emerald-500">
                            {(comparison?.savings ?? 0) > 0
                              ? `₹${(comparison?.savings ?? 0).toLocaleString()}`
                              : 'Enter income to calculate'}
                          </span>
                        </div>
                        {(comparison?.savings ?? 0) > 0 && (
                          <p className="text-xs text-right text-muted-foreground mt-1">by choosing {comparison?.recommended} regime</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ITRFormSuggester income={comparison.oldRegime.grossIncome && deductionsData?.claimed ? {
                salary: comparison.oldRegime.grossIncome,
                rental: 0,
                business: 0,
                capitalGains: { shortTerm: 0, longTerm: 0 },
                otherSources: 0
              } : {
                salary: 0,
                rental: 0,
                business: 0,
                capitalGains: { shortTerm: 0, longTerm: 0 },
                otherSources: 0
              }} />

              <TaxDeadlines />

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gross Total Income</p>
                      <p className="text-lg font-bold">₹{(recommended?.grossIncome ?? 0).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Deductions</p>
                      <p className="text-lg font-bold">₹{(recommended?.totalDeductions ?? 0).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
                <Button className="w-full h-12 gap-2" variant="outline" onClick={() => setActiveTab("income")}>
                  Optimize Deductions <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Income & Deductions Tab */}
        <TabsContent value="income" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Income Form */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Update Income</CardTitle>
                <CardDescription>Enter details of your various income sources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={incomeType} onValueChange={(v: any) => setIncomeType(v)}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="rental">Rental Income</SelectItem>
                        <SelectItem value="business">Business Income</SelectItem>
                        <SelectItem value="other">Other Sources</SelectItem>
                        <SelectItem value="capital_gains_short">Short Term Cap. Gains</SelectItem>
                        <SelectItem value="capital_gains_long">Long Term Cap. Gains</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select value={incomePeriod} onValueChange={(v: any) => setIncomePeriod(v)}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annually">Annual Amount</SelectItem>
                        <SelectItem value="monthly">Monthly Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    className="bg-secondary border-border text-lg"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleUpdateIncome}
                  disabled={isUpdating || !incomeAmount}
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Update Income Source
                </Button>
              </CardContent>
            </Card>

            {/* Deductions Overview */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Deductions Breakdown</CardTitle>
                <CardDescription>Current utilization of tax-saving sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {deductionsData && Object.entries(deductionsData.claimed).map(([key, value]: any) => {
                    // Skip 0 values unless it's a major section
                    if (value === 0 && key !== 'section80C' && key !== 'section80D') return null;

                    const limit = deductionsData.limits[key] || 0;
                    const percentage = limit > 0 ? (value / limit) * 100 : 0;

                    const formatLabel = (k: string) => {
                      const labels: Record<string, string> = {
                        section80C: "Section 80C (Investments)",
                        section80D: "Section 80D (Health Insurance)",
                        section80G: "Donations (80G)",
                        homeLoanInterest: "Home Loan Interest",
                        standardDeduction: "Standard Deduction",
                        professionalTax: "Professional Tax",
                        nps: "NPS (80CCD)",
                        hra: "HRA Exemption",
                        lta: "LTA"
                      };
                      return labels[k] || k.replace(/([A-Z])/g, ' $1').trim();
                    };

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-foreground">{formatLabel(key)}</span>
                          <span className="text-muted-foreground">₹{(value ?? 0).toLocaleString()} / ₹{(limit ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-4 border-t border-border flex justify-between items-center">
                    <span className="text-sm font-bold">Total Deductions</span>
                    <span className="text-lg font-extrabold text-primary">₹{(
                      deductionsData ? Object.values(deductionsData.claimed).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0) : 0
                    ).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Old Regime Estimate */}
            <Card className={cn(
              "bg-card border-border relative overflow-hidden",
              comparison?.recommended === 'old' && "ring-2 ring-primary"
            )}>
              {comparison?.recommended === 'old' && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                    Recommended
                  </div>
                </div>
              )}
              <CardHeader className="bg-secondary/30">
                <CardTitle>Old Tax Regime</CardTitle>
                <CardDescription>With all deductions and exemptions</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Taxable Income</span>
                    <span className="font-semibold font-mono">₹{(comparison?.oldRegime.taxableIncome ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase">Slab Breakdown</p>
                    {comparison?.oldRegime.slabBreakdown.map((slab, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-1">
                        <span className="text-muted-foreground">{slab.slab} ({slab.rate}%)</span>
                        <span className="font-medium">₹{(slab.tax ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 text-sm">
                    <span className="text-muted-foreground">Add 4% Cess</span>
                    <span className="font-medium">₹{(comparison?.oldRegime.cess ?? 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
                  <span className="font-bold">Total Tax Due</span>
                  <span className="text-xl font-black text-primary">₹{(comparison?.oldRegime.totalTax ?? 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* New Regime Estimate */}
            <Card className={cn(
              "bg-card border-border relative overflow-hidden",
              comparison?.recommended === 'new' && "ring-2 ring-primary"
            )}>
              {comparison?.recommended === 'new' && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                    Recommended
                  </div>
                </div>
              )}
              <CardHeader className="bg-secondary/30">
                <CardTitle>New Tax Regime</CardTitle>
                <CardDescription>Lower rates, no deductions</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Taxable Income</span>
                    <span className="font-semibold font-mono">₹{(comparison?.newRegime.taxableIncome ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase">Slab Breakdown</p>
                    {comparison?.newRegime.slabBreakdown.map((slab, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-1">
                        <span className="text-muted-foreground">{slab.slab} ({slab.rate}%)</span>
                        <span className="font-medium">₹{(slab.tax ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 text-sm">
                    <span className="text-muted-foreground">Add 4% Cess</span>
                    <span className="font-medium">₹{(comparison?.newRegime.cess ?? 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
                  <span className="font-bold">Total Tax Due</span>
                  <span className="text-xl font-black text-primary">₹{(comparison?.newRegime.totalTax ?? 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-amber-500/5 border border-amber-500/20">
            <CardContent className="p-4 flex items-start gap-4">
              <Info className="w-5 h-5 text-amber-400 mt-1 shrink-0" />
              <div className="text-sm text-balance">
                <p className="font-medium text-amber-400 mb-1">Disclamer</p>
                <p className="text-muted-foreground">
                  The values shown here are estimates based on your inputs and current Indian Tax Laws for FY 2025-26.
                  Always consult a certified Tax professional before filing returns.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent >
      </Tabs >
    </div >
  )
}
