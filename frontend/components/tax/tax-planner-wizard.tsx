"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Calculator,
    FileText,
    AlertTriangle,
    Lightbulb,
    ShieldCheck,
    Info
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getTaxGuidance, type TaxGuidanceInput, type TaxGuidanceOutput } from "@/lib/api/tax"

interface TaxPlannerWizardProps {
    trigger?: React.ReactNode;
    onComplete?: () => void;
}

type Step = 'basics' | 'deductions' | 'results';

export function TaxPlannerWizard({ trigger, onComplete }: TaxPlannerWizardProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<Step>('basics')
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    // Step 1: Basic Inputs
    const [individualType, setIndividualType] = useState<TaxGuidanceInput['individualType']>('salaried')
    const [incomeRange, setIncomeRange] = useState<TaxGuidanceInput['incomeRange']>('5-10L')
    const [ageGroup, setAgeGroup] = useState<TaxGuidanceInput['ageGroup']>('below_60')
    const [regimePreference, setRegimePreference] = useState<TaxGuidanceInput['regimePreference']>('not_decided')

    // Step 2: Optional Deductions
    const [hasEPF, setHasEPF] = useState(false)
    const [hasPPF, setHasPPF] = useState(false)
    const [hasELSS, setHasELSS] = useState(false)
    const [hasNPS, setHasNPS] = useState(false)
    const [hasHomeLoan, setHasHomeLoan] = useState(false)
    const [hasEducationLoan, setHasEducationLoan] = useState(false)
    const [hasHealthInsurance, setHasHealthInsurance] = useState(false)

    // Results
    const [guidance, setGuidance] = useState<TaxGuidanceOutput | null>(null)

    const handleNext = async () => {
        if (step === 'basics') {
            setStep('deductions')
        } else if (step === 'deductions') {
            await fetchGuidance()
        }
    }

    const fetchGuidance = async () => {
        setIsLoading(true)
        try {
            const input: TaxGuidanceInput = {
                individualType,
                incomeRange,
                ageGroup,
                regimePreference,
                deductions: {
                    hasEPF,
                    hasPPF,
                    hasELSS,
                    hasNPS,
                    hasHomeLoan,
                    hasEducationLoan,
                    hasHealthInsurance,
                }
            }

            const response = await getTaxGuidance(input)
            setGuidance(response.data)
            setStep('results')
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to get tax guidance. Please try again." })
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = () => {
        setStep('basics')
        setGuidance(null)
        setOpen(false)
        if (onComplete) onComplete()
    }

    const handleBack = () => {
        if (step === 'deductions') setStep('basics')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Plan My Taxes</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-primary" />
                        Tax Guidance Wizard
                    </DialogTitle>
                    <DialogDescription>
                        Get personalized ITR form suggestions and tax-saving recommendations.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-6">
                        {['basics', 'deductions', 'results'].map((s) => {
                            const steps = ['basics', 'deductions', 'results'];
                            const currentIdx = steps.indexOf(step);
                            const thisIdx = steps.indexOf(s);
                            return (
                                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${thisIdx <= currentIdx ? 'bg-primary' : 'bg-secondary'}`} />
                            )
                        })}
                    </div>

                    {/* Step 1: Basic Inputs */}
                    {step === 'basics' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Individual Type *</Label>
                                    <Select value={individualType} onValueChange={(v: any) => setIndividualType(v)}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="salaried">Salaried Employee</SelectItem>
                                            <SelectItem value="self_employed">Self-Employed / Freelancer</SelectItem>
                                            <SelectItem value="business_owner">Business Owner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Annual Income Range *</Label>
                                    <Select value={incomeRange} onValueChange={(v: any) => setIncomeRange(v)}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0-5L">Up to ₹5 Lakhs</SelectItem>
                                            <SelectItem value="5-10L">₹5 - ₹10 Lakhs</SelectItem>
                                            <SelectItem value="10-15L">₹10 - ₹15 Lakhs</SelectItem>
                                            <SelectItem value="15-25L">₹15 - ₹25 Lakhs</SelectItem>
                                            <SelectItem value="25-50L">₹25 - ₹50 Lakhs</SelectItem>
                                            <SelectItem value="50L+">Above ₹50 Lakhs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Age Group *</Label>
                                    <Select value={ageGroup} onValueChange={(v: any) => setAgeGroup(v)}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="below_60">Below 60 Years</SelectItem>
                                            <SelectItem value="60_to_80">60 - 80 Years (Senior Citizen)</SelectItem>
                                            <SelectItem value="above_80">Above 80 Years (Super Senior)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tax Regime Preference</Label>
                                    <Select value={regimePreference} onValueChange={(v: any) => setRegimePreference(v)}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="not_decided">Not Decided</SelectItem>
                                            <SelectItem value="old">Old Regime (With Deductions)</SelectItem>
                                            <SelectItem value="new">New Regime (Lower Rates)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Optional Deductions */}
                    {step === 'deductions' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Info className="w-4 h-4" />
                                <span>Select any investments or benefits you currently have (optional)</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Card className={`cursor-pointer transition-all ${hasEPF ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    onClick={() => setHasEPF(!hasEPF)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Checkbox checked={hasEPF} onCheckedChange={(c) => setHasEPF(!!c)} />
                                        <div>
                                            <p className="font-medium text-sm">EPF</p>
                                            <p className="text-xs text-muted-foreground">Employee Provident Fund</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={`cursor-pointer transition-all ${hasPPF ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    onClick={() => setHasPPF(!hasPPF)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Checkbox checked={hasPPF} onCheckedChange={(c) => setHasPPF(!!c)} />
                                        <div>
                                            <p className="font-medium text-sm">PPF</p>
                                            <p className="text-xs text-muted-foreground">Public Provident Fund</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={`cursor-pointer transition-all ${hasELSS ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    onClick={() => setHasELSS(!hasELSS)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Checkbox checked={hasELSS} onCheckedChange={(c) => setHasELSS(!!c)} />
                                        <div>
                                            <p className="font-medium text-sm">ELSS</p>
                                            <p className="text-xs text-muted-foreground">Equity Linked Savings</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={`cursor-pointer transition-all ${hasNPS ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    onClick={() => setHasNPS(!hasNPS)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Checkbox checked={hasNPS} onCheckedChange={(c) => setHasNPS(!!c)} />
                                        <div>
                                            <p className="font-medium text-sm">NPS</p>
                                            <p className="text-xs text-muted-foreground">National Pension System</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={`cursor-pointer transition-all ${hasHealthInsurance ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    onClick={() => setHasHealthInsurance(!hasHealthInsurance)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Checkbox checked={hasHealthInsurance} onCheckedChange={(c) => setHasHealthInsurance(!!c)} />
                                        <div>
                                            <p className="font-medium text-sm">Health Insurance</p>
                                            <p className="text-xs text-muted-foreground">Medical Policy (80D)</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={`cursor-pointer transition-all ${hasHomeLoan ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    onClick={() => setHasHomeLoan(!hasHomeLoan)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Checkbox checked={hasHomeLoan} onCheckedChange={(c) => setHasHomeLoan(!!c)} />
                                        <div>
                                            <p className="font-medium text-sm">Home Loan</p>
                                            <p className="text-xs text-muted-foreground">Section 24 Interest</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={`cursor-pointer transition-all ${hasEducationLoan ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    onClick={() => setHasEducationLoan(!hasEducationLoan)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Checkbox checked={hasEducationLoan} onCheckedChange={(c) => setHasEducationLoan(!!c)} />
                                        <div>
                                            <p className="font-medium text-sm">Education Loan</p>
                                            <p className="text-xs text-muted-foreground">80E Interest Deduction</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Results */}
                    {step === 'results' && guidance && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            {/* ITR Form Suggestion */}
                            <Card className="border-primary/30 bg-primary/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Recommended ITR Form
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <Badge className="text-lg px-3 py-1 bg-primary text-primary-foreground">
                                            {guidance.itrForm.suggested}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{guidance.itrForm.reason}</p>
                                </CardContent>
                            </Card>

                            {/* Regime Comparison */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        Regime Comparison
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                                            <p className="font-semibold text-sm mb-2">Old Regime Benefits</p>
                                            <ul className="text-xs text-muted-foreground space-y-1">
                                                {guidance.regimeComparison.oldRegimeBenefits.slice(0, 4).map((b, i) => (
                                                    <li key={i}>• {b}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                                            <p className="font-semibold text-sm mb-2">New Regime Benefits</p>
                                            <ul className="text-xs text-muted-foreground space-y-1">
                                                {guidance.regimeComparison.newRegimeBenefits.map((b, i) => (
                                                    <li key={i}>• {b}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                        <div className="flex gap-2">
                                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">{guidance.regimeComparison.recommendation}</p>
                                                {guidance.regimeComparison.estimatedDifference && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Estimated Difference: {guidance.regimeComparison.estimatedDifference}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Suggestions */}
                            {guidance.suggestions.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            Tax-Saving Opportunities
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {guidance.suggestions.map((s, i) => (
                                            <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                                                <Badge variant="outline" className={`shrink-0 ${s.priority === 'high' ? 'border-red-500 text-red-500' : 'border-amber-500 text-amber-500'}`}>
                                                    {s.section}
                                                </Badge>
                                                <div>
                                                    <p className="font-medium text-sm">{s.title}</p>
                                                    <p className="text-xs text-muted-foreground">{s.benefit}</p>
                                                    {s.maxDeduction > 0 && (
                                                        <p className="text-xs text-primary mt-1">Max: ₹{s.maxDeduction.toLocaleString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Disclaimers */}
                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                <div className="flex gap-2">
                                    <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        {guidance.disclaimers.slice(0, 3).map((d, i) => (
                                            <p key={i}>• {d}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex sm:justify-between gap-2">
                    {step === 'deductions' && (
                        <Button variant="outline" onClick={handleBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    )}
                    {step === 'results' ? (
                        <Button className="w-full sm:w-auto" onClick={handleReset}>
                            Done
                        </Button>
                    ) : (
                        <Button className="w-full sm:w-auto ml-auto" onClick={handleNext} disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {step === 'basics' ? 'Next' : 'Get Guidance'} <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
