"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"

export function TaxDeadlines() {
    // Current Date for calculations
    const today = new Date();

    const deadlines = [
        {
            date: "2025-06-15",
            event: "Advance Tax (15%)",
            description: "1st Installment due"
        },
        {
            date: "2025-07-31",
            event: "ITR Filing Deadline",
            description: "For non-audit cases (Most Individuals)",
            critical: true
        },
        {
            date: "2025-09-15",
            event: "Advance Tax (45%)",
            description: "2nd Installment due"
        },
        {
            date: "2025-12-15",
            event: "Advance Tax (75%)",
            description: "3rd Installment due"
        },
        {
            date: "2026-03-15",
            event: "Advance Tax (100%)",
            description: "Final Installment due"
        }
    ];

    const getStatus = (dateStr: string) => {
        const due = new Date(dateStr);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'passed', days: Math.abs(diffDays), color: 'text-muted-foreground' };
        if (diffDays <= 7) return { status: 'urgent', days: diffDays, color: 'text-red-500' };
        if (diffDays <= 30) return { status: 'upcoming', days: diffDays, color: 'text-amber-500' };
        return { status: 'future', days: diffDays, color: 'text-emerald-500' };
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Tax Calendar</CardTitle>
                </div>
                <CardDescription>Upcoming deadlines for FY 2025-26</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {deadlines.map((item, idx) => {
                        const { status, days, color } = getStatus(item.date);
                        const isPassed = status === 'passed';

                        return (
                            <div key={idx} className={`relative flex items-center gap-4 p-3 rounded-lg border transition-all ${isPassed ? 'bg-secondary/20 border-border/50 opacity-60' : 'bg-card border-border hover:border-primary/30'}`}>
                                <div className={`p-2 rounded-full shrink-0 ${isPassed ? 'bg-secondary' : 'bg-primary/10'}`}>
                                    {isPassed ?
                                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> :
                                        <Clock className={`w-4 h-4 ${color}`} />
                                    }
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h4 className={`text-sm font-semibold truncate pr-2 ${isPassed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                            {item.event}
                                        </h4>
                                        {item.critical && !isPassed && (
                                            <Badge variant="destructive" className="text-[10px] h-4 px-1">MANDATORY</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                </div>

                                <div className="text-right shrink-0 min-w-[60px]">
                                    <p className={`text-xs font-bold ${color}`}>
                                        {isPassed ? 'DONE' : `${days} Days`}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{formatDate(item.date)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 p-3 rounded-md bg-blue-500/5 border border-blue-500/10 mt-2">
                    <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-tight">
                        Missing the <span className="font-semibold text-foreground">July 31</span> deadline attracts a penalty of up to ₹5,000 u/s 234F.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
