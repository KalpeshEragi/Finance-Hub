"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle2, AlertCircle } from "lucide-react"

interface ITRFormSuggesterProps {
    income: {
        salary: number;
        rental: number;
        business: number;
        capitalGains: { shortTerm: number; longTerm: number };
        otherSources: number;
    };
}

export function ITRFormSuggester({ income }: ITRFormSuggesterProps) {
    // Logic to suggest ITR Form
    // ITR-1: salary, one house property, other sources (interest etc.), income up to 50L
    // ITR-2: salary, more than one house property, capital gains, income > 50L, foreign assets
    // ITR-3: income from business or profession
    // ITR-4: presumptive business/profession income

    const totalIncome =
        income.salary +
        income.rental +
        income.business +
        income.otherSources +
        (income.capitalGains?.shortTerm ?? 0) +
        (income.capitalGains?.longTerm ?? 0);

    let suggestedForm = "ITR-1";
    let reason = "Your income primarily comes from salary and other sources.";
    let description = "For individuals being a resident (other than not ordinarily resident) having total income upto Rs.50 lakh, having Income from Salaries, one house property, other sources (Interest etc.), and agricultural income upto Rs.5000.";

    if (income.business > 0) {
        suggestedForm = "ITR-3";
        reason = "You have income from business or profession.";
        description = "For individuals and HUFs having income from proprietary business or profession.";
    } else if (income.capitalGains.shortTerm > 0 || income.capitalGains.longTerm > 0) {
        suggestedForm = "ITR-2";
        reason = "You have capital gains from investments.";
        description = "For Individuals and HUFs not having income from profits and gains of business or profession.";
    } else if (totalIncome > 5000000) {
        suggestedForm = "ITR-2";
        reason = "Your total income exceeds ₹50 Lakhs.";
        description = "For Individuals and HUFs not having income from profits and gains of business or profession.";
    } else if (income.rental > 0) {
        // If more than one house property, ITR-2 is needed. 
        // We don't track number of properties, but we can nudge user to check.
        suggestedForm = "ITR-1";
        reason = "You have rental income from a house property.";
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">ITR Preparation</CardTitle>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                        {suggestedForm} Recommended
                    </Badge>
                </div>
                <CardDescription>Based on your current income sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-sm">Suggested Form: {suggestedForm}</p>
                            <p className="text-xs text-muted-foreground">{reason}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Form Details</p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                        {description}
                    </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground italic">
                        Note: This is an automated suggestion based on your provided data. Actual form requirement may vary depending on specific tax rules (e.g. foreign assets, loss set-off).
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
