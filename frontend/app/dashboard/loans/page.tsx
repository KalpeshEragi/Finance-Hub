"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Loader2,
    Plus,
    TrendingDown,
    Calendar,
    Percent,
    Building2,
    CreditCard,
    Home,
    Car,
    GraduationCap,
    Wallet,
    MoreVertical,
    Trash2,
    CheckCircle,
} from "lucide-react"
import {
    getLoans,
    createLoan,
    deleteLoan,
    recordLoanPayment,
    calculateEMI,
    type Loan,
    type LoanSummary,
    type CreateLoanPayload,
} from "@/lib/api/loans"
import { SmartRecommendations } from "@/components/loans/smart-recommendations"

const loanTypeIcons: Record<Loan["loanType"], React.ElementType> = {
    home: Home,
    car: Car,
    personal: Wallet,
    education: GraduationCap,
    credit_card: CreditCard,
    other: Building2,
}

const loanTypeLabels: Record<Loan["loanType"], string> = {
    home: "Home Loan",
    car: "Car Loan",
    personal: "Personal Loan",
    education: "Education Loan",
    credit_card: "Credit Card",
    other: "Other",
}

function LoanCard({
    loan,
    onPayment,
    onDelete,
}: {
    loan: Loan
    onPayment: (id: string) => void
    onDelete: (id: string) => void
}) {
    const Icon = loanTypeIcons[loan.loanType]
    const paidPercentage = ((loan.principalAmount - loan.outstandingAmount) / loan.principalAmount) * 100
    const daysToPayment = Math.ceil(
        (new Date(loan.nextPaymentDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    return (
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">{loan.name}</h3>
                            <p className="text-xs text-muted-foreground">{loanTypeLabels[loan.loanType]}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={loan.status === "active" ? "default" : "secondary"}>
                            {loan.status}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => onPayment(loan.id)}
                                    disabled={loan.status !== "active"}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Record Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(loan.id)} className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className="font-medium text-foreground">
                            ₹{loan.outstandingAmount.toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">EMI Amount</span>
                        <span className="font-medium text-primary">
                            ₹{loan.emiAmount.toLocaleString("en-IN")}/mo
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Repaid</span>
                            <span>{paidPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={paidPercentage} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Percent className="w-3.5 h-3.5" />
                            {loan.interestRate}% p.a.
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {daysToPayment > 0 ? (
                                <span className={daysToPayment <= 7 ? "text-destructive" : "text-muted-foreground"}>
                                    Due in {daysToPayment} days
                                </span>
                            ) : (
                                <span className="text-destructive">Overdue!</span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function AddLoanDialog({ onLoanAdded }: { onLoanAdded: () => void }) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const [formData, setFormData] = useState<CreateLoanPayload>({
        name: "",
        loanType: "personal",
        principalAmount: 0,
        interestRate: 0,
        tenureMonths: 12,
        lender: "",
        description: "",
    })

    const emiPreview =
        formData.principalAmount > 0 && formData.tenureMonths > 0
            ? calculateEMI(formData.principalAmount, formData.interestRate, formData.tenureMonths)
            : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await createLoan(formData)
            toast({ title: "Loan added successfully" })
            setOpen(false)
            onLoanAdded()
            setFormData({
                name: "",
                loanType: "personal",
                principalAmount: 0,
                interestRate: 0,
                tenureMonths: 12,
                lender: "",
                description: "",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add loan",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Loan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Loan</DialogTitle>
                    <DialogDescription>
                        Enter your loan details. EMI will be calculated automatically.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Loan Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Home Loan - SBI"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="loanType">Loan Type</Label>
                                <Select
                                    value={formData.loanType}
                                    onValueChange={(value: Loan["loanType"]) =>
                                        setFormData({ ...formData, loanType: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(loanTypeLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="lender">Lender (Optional)</Label>
                                <Input
                                    id="lender"
                                    placeholder="e.g., SBI, HDFC"
                                    value={formData.lender}
                                    onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="principalAmount">Principal Amount (₹)</Label>
                            <Input
                                id="principalAmount"
                                type="number"
                                min="1"
                                placeholder="e.g., 500000"
                                value={formData.principalAmount || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, principalAmount: parseFloat(e.target.value) || 0 })
                                }
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="interestRate">Interest Rate (% p.a.)</Label>
                                <Input
                                    id="interestRate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    placeholder="e.g., 8.5"
                                    value={formData.interestRate || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tenureMonths">Tenure (Months)</Label>
                                <Input
                                    id="tenureMonths"
                                    type="number"
                                    min="1"
                                    placeholder="e.g., 60"
                                    value={formData.tenureMonths || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tenureMonths: parseInt(e.target.value) || 0 })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        {emiPreview > 0 && (
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Estimated Monthly EMI</span>
                                        <span className="text-xl font-bold text-primary">
                                            ₹{emiPreview.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Add Loan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function LoansPage() {
    const [loans, setLoans] = useState<Loan[]>([])
    const [summary, setSummary] = useState<LoanSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    const fetchLoans = async () => {
        setIsLoading(true)
        try {
            const result = await getLoans()
            if (result?.success && result?.data) {
                setLoans(result.data.loans)
                setSummary(result.data.summary)
            }
        } catch (error: any) {
            setLoans([])
            toast({
                title: "Error fetching loans",
                description: error.message || "Something went wrong",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLoans()
    }, [])

    const handlePayment = async (id: string) => {
        try {
            await recordLoanPayment(id)
            toast({ title: "Payment recorded successfully" })
            fetchLoans()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to record payment",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteLoan(id)
            toast({ title: "Loan deleted successfully" })
            fetchLoans()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete loan",
                variant: "destructive",
            })
        }
    }

    return (
        <>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Loans & Debt</h1>
                    <p className="text-sm text-muted-foreground">
                        Track your loans, EMIs, and manage your debt effectively
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                    <AddLoanDialog onLoanAdded={fetchLoans} />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-card border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Loans</p>
                                <p className="text-2xl font-bold text-foreground">{summary?.totalLoans ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Loans</p>
                                <p className="text-2xl font-bold text-foreground">{summary?.activeLoans ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                                <p className="text-2xl font-bold text-foreground">
                                    ₹{(summary?.totalOutstanding ?? 0).toLocaleString("en-IN")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly EMI</p>
                                <p className="text-2xl font-bold text-primary">
                                    ₹{(summary?.totalMonthlyEMI ?? 0).toLocaleString("en-IN")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Loans Grid */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground">Your Loans</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : loans.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">No loans yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Add your loans to track EMIs and manage your debt
                            </p>
                            <AddLoanDialog onLoanAdded={fetchLoans} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {loans.map((loan) => (
                                <LoanCard
                                    key={loan.id}
                                    loan={loan}
                                    onPayment={handlePayment}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Monthly EMI Impact Notice */}
            {summary && summary.totalMonthlyEMI > 0 && (
                <Card className="mt-6 bg-primary/5 border-primary/20">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground mb-1">Monthly EMI Impact</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your total monthly EMI obligation is{" "}
                                    <span className="font-semibold text-primary">
                                        ₹{summary.totalMonthlyEMI.toLocaleString("en-IN")}
                                    </span>
                                    . This amount is automatically tracked as a recurring expense in your budget.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Smart Recommendations Section */}
            <div className="mt-8">
                <SmartRecommendations />
            </div>
        </>
    )
}

