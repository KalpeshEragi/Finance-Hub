"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, BrainCircuit, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react"
import { getRecommendation, type RecommendationResult } from "@/lib/api/transactions"
import { parseTransaction } from "@/lib/api/transactions"
import { toast } from "sonner"

export default function DemoSimulatorPage() {
    const [input, setInput] = useState("")
    const [parsed, setParsed] = useState<any>(null)
    const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Demo presets
    const presets = [
        "Buying new iPhone 15 on Amazon for Rs 79900",
        "Dinner at Swiggy for Rs 850",
        "Paying Electricity Bill Rs 2400 on Paytm"
    ]

    const handleSimulate = async () => {
        if (!input) return
        setIsAnalyzing(true)
        setParsed(null)
        setRecommendations([])

        try {
            // Step 1: Parse Text (Simulate AI Parser)
            const parseRes = await parseTransaction(input)

            if (parseRes.success && parseRes.data) {
                setParsed(parseRes.data)

                // Step 2: Get Recommendations based on parsed data
                // Need to handle potential undefined fields safely
                const amount = parseRes.data.amount || 0;
                const merchant = parseRes.data.merchant || "Unknown";
                const category = parseRes.data.category || "General";

                const recRes = await getRecommendation(amount, merchant, category)
                if (recRes.success) {
                    setRecommendations(recRes.data)
                    toast.success("AI Analysis Complete")
                }
            } else {
                toast.error("Could not parse text. Try valid format.")
            }
        } catch (error) {
            toast.error("Simulation failed")
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto p-4">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    AI Payment Brain Simulator
                </h1>
                <p className="text-muted-foreground">
                    "Zero-API" demonstration of intelligent categorization & source recommendation.
                </p>
            </div>

            {/* Input Section */}
            <Card className="border-primary/20 bg-secondary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-purple-500" />
                        Simulation Input
                    </CardTitle>
                    <CardDescription>
                        Type a natural language transaction or use a preset.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. Paid Rs 1500 to Zomato..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="font-mono"
                        />
                        <Button onClick={handleSimulate} disabled={isAnalyzing}>
                            {isAnalyzing ? "Processing..." : "Simulate"}
                        </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {presets.map(p => (
                            <Badge
                                key={p}
                                variant="outline"
                                className="cursor-pointer hover:bg-secondary"
                                onClick={() => setInput(p)}
                            >
                                {p}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">

                {/* Step 1: Parser Output */}
                <Card className={`border-l-4 ${parsed ? 'border-l-green-500' : 'border-l-muted'}`}>
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                            Step 1: Context Understanding
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {parsed ? (
                            <div className="space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Merchant</span>
                                    <span className="font-bold">{parsed.merchant}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-mono">₹{parsed.amount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Detected Category</span>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {parsed.category}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm italic">
                                Waiting for input...
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Source Recommendation */}
                <Card className={`border-l-4 ${recommendations.length > 0 ? 'border-l-blue-500' : 'border-l-muted'}`}>
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                            Step 2: Best Source Recommendation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recommendations.length > 0 ? (
                            <div className="space-y-3">
                                {recommendations.map((rec, idx) => (
                                    <div
                                        key={rec.sourceId}
                                        className={`p-3 rounded-lg border flex justify-between items-start ${rec.isRecommended ? 'bg-green-500/10 border-green-500/50' : 'bg-card'}`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{rec.sourceName}</span>
                                                {rec.isRecommended && <Badge className="bg-green-600 text-[10px] h-5">BEST</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{rec.matchReason}</p>
                                            {rec.safetyWarning && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {rec.safetyWarning}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold flex items-center justify-end gap-1">
                                                <span className="text-xs text-muted-foreground">Score</span>
                                                {rec.score}/10
                                            </div>
                                            <div className="text-xs text-green-600 font-medium">
                                                Save ₹{rec.estimatedSavings}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm italic">
                                Rules engine idle...
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
