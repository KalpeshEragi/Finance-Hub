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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2, ArrowRight, CheckCircle2 } from "lucide-react"
import { parseTransaction, createTransaction } from "@/lib/api/transactions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface SmartImportDialogProps {
    onSuccess?: () => void
}

export function SmartImportDialog({ onSuccess }: SmartImportDialogProps) {
    const [open, setOpen] = useState(false)
    const [text, setText] = useState("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleAnalyze = async () => {
        if (!text.trim()) return

        setIsAnalyzing(true)
        try {
            const response = await parseTransaction(text)

            if (response.success && response.data) {
                setResult(response.data)
                toast.success("Transaction analyzed successfully!")
            } else {
                toast.error(response.message || "Could not understand the format")
                setResult(null)
            }
        } catch (error) {
            toast.error("Analysis failed. Try again.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleConfirm = async () => {
        if (!result) return

        try {
            await createTransaction({
                ...result,
                isAutoCategorized: true
            })
            toast.success("Transaction saved!")
            setOpen(false)
            setResult(null)
            setText("")
            onSuccess?.()
        } catch (error) {
            toast.error("Failed to save transaction")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Smart Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        AI Transaction Parser
                    </DialogTitle>
                    <DialogDescription>
                        Paste an SMS or email notification to auto-extract details.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Paste SMS / Text</Label>
                            <Textarea
                                placeholder="e.g. Rs 500 debited from HDFC Bank XX1234 for Zomato on 25-01-01"
                                className="min-h-[100px]"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </div>
                        <div className="bg-secondary/20 p-3 rounded-lg text-xs text-muted-foreground">
                            <strong>Detects:</strong> PhonePe, GPay, Paytm, Amazon Pay, HDFC, SBI, ICICI, Credit/Debit Cards & 15+ categories
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-center p-4 bg-green-500/10 rounded-full w-12 h-12 mx-auto">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>

                        <div className="space-y-3 border rounded-lg p-4 bg-card">
                            {/* Payment Source (if detected) */}
                            {(result.paymentApp || result.bank || result.cardType) && (
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-muted-foreground">Payment Source</span>
                                    <div className="flex gap-1.5 flex-wrap justify-end">
                                        {result.paymentApp && (
                                            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-500/10">
                                                {result.paymentApp}
                                            </Badge>
                                        )}
                                        {result.bank && (
                                            <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-500/10">
                                                {result.bank}
                                            </Badge>
                                        )}
                                        {result.cardType && (
                                            <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/10">
                                                {result.cardType}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Merchant</span>
                                <span className="font-semibold">{result.merchant}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Amount</span>
                                <span className={`font-bold text-lg ${result.type === 'income' ? 'text-green-600' : 'text-foreground'}`}>
                                    {result.type === 'income' ? '+' : '-'}₹{result.amount?.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Category</span>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {result.category}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Date</span>
                                <span className="text-sm">{result.date}</span>
                            </div>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="text-muted-foreground">
                            Start Over
                        </Button>
                    </div>
                )}

                <DialogFooter>
                    {!result ? (
                        <Button onClick={handleAnalyze} disabled={isAnalyzing || !text}>
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    Analyze Text
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleConfirm} className="w-full bg-green-600 hover:bg-green-700">
                            Confirm & Save
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
