"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Receipt,
  FileText,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Home,
  Building2,
  TrendingUp,
  Users,
  Landmark,
  Scale,
  FileCheck,
  IndianRupee,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ITRForm {
  id: string
  name: string
  shortName: string
  description: string
  icon: React.ElementType
  color: string
}

const itrForms: ITRForm[] = [
  {
    id: "itr1",
    name: "ITR-1 (Sahaj)",
    shortName: "ITR-1",
    description: "Salaried individuals with income up to ₹50 lakh",
    icon: Briefcase,
    color: "emerald",
  },
  {
    id: "itr2",
    name: "ITR-2",
    shortName: "ITR-2",
    description: "Individuals/HUFs with capital gains, foreign income",
    icon: Home,
    color: "blue",
  },
  {
    id: "itr3",
    name: "ITR-3",
    shortName: "ITR-3",
    description: "Individuals/HUFs with business or profession income",
    icon: Building2,
    color: "purple",
  },
  {
    id: "itr4",
    name: "ITR-4 (Sugam)",
    shortName: "ITR-4",
    description: "Presumptive income under Section 44AD/44ADA/44AE",
    icon: TrendingUp,
    color: "amber",
  },
  {
    id: "itr5",
    name: "ITR-5",
    shortName: "ITR-5",
    description: "For Firms, LLPs, AOPs, BOIs, Cooperative Societies",
    icon: Users,
    color: "cyan",
  },
  {
    id: "itr6",
    name: "ITR-6",
    shortName: "ITR-6",
    description: "For Companies not claiming exemption u/s 11",
    icon: Landmark,
    color: "rose",
  },
  {
    id: "itr7",
    name: "ITR-7",
    shortName: "ITR-7",
    description: "Trusts, political parties, institutions u/s 139(4A-4F)",
    icon: Scale,
    color: "indigo",
  },
  {
    id: "itr7b",
    name: "ITR-7B",
    shortName: "ITR-7B",
    description: "For entities with modified return requirements",
    icon: FileCheck,
    color: "pink",
  },
]

interface SalaryRange {
  id: string
  range: string
  description: string
  taxNote?: string
}

const salaryRanges: SalaryRange[] = [
  {
    id: "range1",
    range: "Up to ₹2.5 lakh",
    description: "Basic exemption limit",
    taxNote: "No tax liability under both regimes",
  },
  {
    id: "range2",
    range: "₹2.5 lakh – ₹5 lakh",
    description: "5% tax slab",
    taxNote: "Tax rebate u/s 87A available (New Regime: up to ₹7 lakh)",
  },
  {
    id: "range3",
    range: "₹5 lakh – ₹7.5 lakh",
    description: "10-20% tax slab",
    taxNote: "Consider deductions to reduce taxable income",
  },
  {
    id: "range4",
    range: "₹7.5 lakh – ₹10 lakh",
    description: "15-20% tax slab",
    taxNote: "Compare old vs new regime carefully",
  },
  {
    id: "range5",
    range: "₹10 lakh – ₹15 lakh",
    description: "20-30% tax slab",
    taxNote: "Maximize 80C, 80D, HRA deductions",
  },
  {
    id: "range6",
    range: "₹15 lakh – ₹25 lakh",
    description: "25-30% tax slab",
    taxNote: "High earners - plan investments strategically",
  },
  {
    id: "range7",
    range: "Above ₹25 lakh",
    description: "30% tax slab + surcharge",
    taxNote: "Surcharge applicable above ₹50 lakh",
  },
]

const colorClasses: Record<string, { bg: string; border: string; text: string; selected: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    selected: "border-emerald-500 bg-emerald-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    selected: "border-blue-500 bg-blue-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    selected: "border-purple-500 bg-purple-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    selected: "border-amber-500 bg-amber-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    selected: "border-cyan-500 bg-cyan-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    selected: "border-rose-500 bg-rose-500/20",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    text: "text-indigo-400",
    selected: "border-indigo-500 bg-indigo-500/20",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    selected: "border-pink-500 bg-pink-500/20",
  },
}

export default function TaxPage() {
  const [selectedITR, setSelectedITR] = useState<string | null>(null)
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string | null>(null)

  const handleSelectITR = (itrId: string) => {
    setSelectedITR(selectedITR === itrId ? null : itrId)
  }

  const handleSelectSalaryRange = (rangeId: string) => {
    setSelectedSalaryRange(selectedSalaryRange === rangeId ? null : rangeId)
  }

  const canGenerateReport = selectedITR && selectedSalaryRange

  const selectedFormData = itrForms.find((f) => f.id === selectedITR)
  const selectedRangeData = salaryRanges.find((r) => r.id === selectedSalaryRange)

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Receipt className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tax Center</h1>
            <p className="text-sm text-muted-foreground">
              Select your ITR form and income range to generate your report
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 w-fit">
          <AlertCircle className="w-3 h-3 mr-1" />
          FY 2025-26 (AY 2026-27)
        </Badge>
      </div>

      {/* Help Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20 mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground mb-1">How to generate your ITR report?</h3>
              <p className="text-sm text-muted-foreground">
                1. Select your applicable ITR form below. 2. Choose your annual salary range. 3. Click "Generate ITR
                Report" to get your personalized tax filing guidance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - ITR Form Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* ITR Form Selection */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Step 1: Select Your ITR Form
              </CardTitle>
              <CardDescription>Choose the ITR form applicable to your income sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {itrForms.map((form) => {
                  const colors = colorClasses[form.color]
                  const IconComponent = form.icon
                  const isSelected = selectedITR === form.id

                  return (
                    <div
                      key={form.id}
                      className={cn(
                        "relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                        isSelected ? colors.selected : "bg-secondary/30 border-border hover:border-muted-foreground/30",
                      )}
                      onClick={() => handleSelectITR(form.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectITR(form.id)}
                        className={cn("mt-0.5 border-2", isSelected ? colors.border : "border-muted-foreground/50")}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("p-1.5 rounded-lg", colors.bg)}>
                            <IconComponent className={cn("w-4 h-4", colors.text)} />
                          </div>
                          <span className="font-semibold text-foreground">{form.shortName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{form.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Salary Range Selection */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
                Step 2: Select Your Annual Salary Range
              </CardTitle>
              <CardDescription>Choose the income bracket that matches your gross annual salary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {salaryRanges.map((range) => {
                  const isSelected = selectedSalaryRange === range.id

                  return (
                    <div
                      key={range.id}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "bg-secondary/30 border-border hover:border-muted-foreground/30",
                      )}
                      onClick={() => handleSelectSalaryRange(range.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectSalaryRange(range.id)}
                        className={cn(
                          "mt-0.5 border-2",
                          isSelected ? "border-emerald-500" : "border-muted-foreground/50",
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground">{range.range}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              isSelected
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                : "border-border bg-secondary/50 text-muted-foreground",
                            )}
                          >
                            {range.description}
                          </Badge>
                        </div>
                        {range.taxNote && <p className="text-xs text-muted-foreground">{range.taxNote}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Generate Button */}
        <div className="space-y-6">
          {/* Selection Summary */}
          <Card className="bg-card border-border sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Your Selection
              </CardTitle>
              <CardDescription>Review your choices before generating the report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected ITR Form */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">ITR Form</Label>
                {selectedFormData ? (
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn("p-2 rounded-lg", colorClasses[selectedFormData.color].bg)}>
                      <selectedFormData.icon className={cn("w-4 h-4", colorClasses[selectedFormData.color].text)} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedFormData.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedFormData.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No form selected</p>
                )}
              </div>

              {/* Selected Salary Range */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Annual Salary</Label>
                {selectedRangeData ? (
                  <div className="mt-2">
                    <p className="font-semibold text-foreground">{selectedRangeData.range}</p>
                    <p className="text-xs text-muted-foreground">{selectedRangeData.taxNote}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No range selected</p>
                )}
              </div>

              {/* Generate Report Button */}
              <Button
                className={cn(
                  "w-full h-14 text-base font-semibold transition-all duration-300",
                  canGenerateReport
                    ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
                disabled={!canGenerateReport}
              >
                <FileText className="w-5 h-5 mr-2" />
                Generate ITR Report
              </Button>

              {!canGenerateReport && (
                <p className="text-xs text-center text-muted-foreground">
                  Please select both ITR form and salary range to continue
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Quick Tips
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>
                    <strong className="text-foreground">ITR-1</strong> is for most salaried employees with income up to
                    ₹50 lakh
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>
                    If you have <strong className="text-foreground">capital gains</strong> from stocks/mutual funds, use
                    ITR-2
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>
                    Freelancers and businesses should use <strong className="text-foreground">ITR-3 or ITR-4</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>
                    Due date for FY 2025-26: <strong className="text-foreground">31st July 2026</strong>
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
