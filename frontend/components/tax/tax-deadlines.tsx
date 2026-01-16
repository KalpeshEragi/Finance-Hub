"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertTriangle } from "lucide-react"

export function TaxDeadlines() {
    const deadlines = [
        {
            date: "Mar 15, 2025",
            event: "4th Installment for Advance Tax",
            status: "passed",
            importance: "high"
        },
        {
            date: "Jun 15, 2025",
            event: "1st Installment for Advance Tax",
            status: "upcoming",
            importance: "medium"
        },
        {
            date: "Jul 31, 2025",
            event: "ITR Filing Deadline (Non-Audit)",
            status: "upcoming",
            importance: "critical"
        },
        {
            date: "Sep 15, 2025",
            event: "2nd Installment for Advance Tax",
            status: "upcoming",
            importance: "medium"
        },
        {
            date: "Dec 31, 2025",
            event: "Belated/Revised ITR Deadline",
            status: "upcoming",
            importance: "high"
        }
    ];

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Compliance Calendar</CardTitle>
                </div>
                <CardDescription>Important Tax Deadlines for FY 2025-26</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {deadlines.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-colors">
                            <div className="p-2 rounded-md bg-background border border-border shrink-0 group-hover:border-primary/20">
                                <Clock className={`w-4 h-4 ${item.status === 'passed' ? 'text-muted-foreground' : 'text-primary'}`} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className={`text-xs font-bold ${item.status === 'passed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                        {item.date}
                                    </p>
                                    {item.importance === 'critical' && item.status !== 'passed' && (
                                        <Badge variant="destructive" className="text-[8px] h-4 px-1 uppercase animate-pulse">Critical</Badge>
                                    )}
                                </div>
                                <p className={`text-sm ${item.status === 'passed' ? 'text-muted-foreground' : 'text-foreground/90 font-medium'}`}>
                                    {item.event}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/5 border border-blue-500/20">
                    <AlertTriangle className="w-3 h-3 text-blue-400 shrink-0" />
                    <p className="text-[10px] text-muted-foreground">
                        Advance tax applies if total tax liability &gt; ₹10,000.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
