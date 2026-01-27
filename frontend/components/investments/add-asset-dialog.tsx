"use client"

import { useState } from "react"
import { CalendarIcon, Minus, Plus, TrendingUp } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { createInvestment } from "@/lib/api/investments"

// =============================================================================
// TYPES
// =============================================================================

type AssetType = "mutual_fund" | "stock" | "ppf" | "other"
type InvestmentMode = "sip" | "lumpsum" | "stp"
type SipFrequency = "weekly" | "monthly" | "yearly"
type SchemeType = "PPF" | "NPS" | "EPF" | "ELSS"

interface AddAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// =============================================================================
// LOCK-IN INFO FOR PPF SCHEMES
// =============================================================================

const SCHEME_LOCK_IN: Record<SchemeType, string> = {
  PPF: "15 years lock-in period",
  NPS: "Until retirement (60 years)",
  EPF: "Until retirement or resignation",
  ELSS: "3 years lock-in period",
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AddAssetDialog({ open, onOpenChange, onSuccess }: AddAssetDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Common fields
  const [assetType, setAssetType] = useState<AssetType>("mutual_fund")
  const [assetName, setAssetName] = useState("")
  const [amount, setAmount] = useState("")
  const [investmentDate, setInvestmentDate] = useState<Date>(new Date())
  const [investmentMode, setInvestmentMode] = useState<InvestmentMode>("lumpsum")

  // Mutual Fund specific
  const [sipFrequency, setSipFrequency] = useState<SipFrequency>("monthly")

  // Stock specific
  const [quantity, setQuantity] = useState(1)

  // PPF specific
  const [schemeType, setSchemeType] = useState<SchemeType>("PPF")

  // Reset form
  const resetForm = () => {
    setAssetType("mutual_fund")
    setAssetName("")
    setAmount("")
    setInvestmentDate(new Date())
    setInvestmentMode("lumpsum")
    setSipFrequency("monthly")
    setQuantity(1)
    setSchemeType("PPF")
  }

  // Handle submit
  const handleSubmit = async () => {
    // Validation
    if (!assetName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an asset name.",
        variant: "destructive",
      })
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Build payload based on asset type
      const payload: any = {
        name: assetName.trim(),
        symbol: assetName.trim().toUpperCase().replace(/\s+/g, ""),
        type: assetType,
        amount: numAmount,
        investmentDate: investmentDate.toISOString(),
        investmentMode,
        // Legacy fields (set to 0 for ledger-first approach)
        quantity: assetType === "stock" ? quantity : 1,
        averagePrice: numAmount,
        currentPrice: numAmount,
      }

      // Add type-specific fields
      if (assetType === "mutual_fund") {
        payload.sipFrequency = investmentMode === "sip" ? sipFrequency : undefined
      } else if (assetType === "ppf") {
        payload.schemeType = schemeType
      }

      await createInvestment(payload)

      toast({
        title: "Asset Added",
        description: `${assetName} has been added to your portfolio.`,
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add asset. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5 text-primary" />
            Add Investment Asset
          </DialogTitle>
          <DialogDescription>
            Track your investments to analyze your financial behavior.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Asset Type */}
          <div className="grid gap-2">
            <Label htmlFor="assetType">Asset Type</Label>
            <Select
              value={assetType}
              onValueChange={(v) => {
                setAssetType(v as AssetType)
                setAssetName("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mutual_fund">Mutual Fund / Index Fund</SelectItem>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="ppf">PPF / Government Schemes</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields Based on Asset Type */}
          {assetType === "mutual_fund" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="fundName">Fund Name</Label>
                <Input
                  id="fundName"
                  placeholder="e.g., Nifty 50 Index Fund"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Investment Mode</Label>
                <Select
                  value={investmentMode}
                  onValueChange={(v) => setInvestmentMode(v as InvestmentMode)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sip">SIP (Systematic Investment Plan)</SelectItem>
                    <SelectItem value="stp">STP (Systematic Transfer Plan)</SelectItem>
                    <SelectItem value="lumpsum">Lump Sum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(investmentMode === "sip" || investmentMode === "stp") && (
                <div className="grid gap-2">
                  <Label>SIP Frequency</Label>
                  <Select
                    value={sipFrequency}
                    onValueChange={(v) => setSipFrequency(v as SipFrequency)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>{investmentMode === "sip" ? "Start Date" : "Investment Date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !investmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {investmentDate ? format(investmentDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={investmentDate}
                      onSelect={(d) => d && setInvestmentDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          {assetType === "stock" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="stockName">Stock Name</Label>
                <Input
                  id="stockName"
                  placeholder="e.g., Reliance Industries"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="buyAmount">Buy Amount (₹)</Label>
                <Input
                  id="buyAmount"
                  type="number"
                  placeholder="e.g., 10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Buy Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !investmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {investmentDate ? format(investmentDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={investmentDate}
                      onSelect={(d) => d && setInvestmentDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {assetType === "ppf" && (
            <>
              <div className="grid gap-2">
                <Label>Scheme Type</Label>
                <Select
                  value={schemeType}
                  onValueChange={(v) => {
                    setSchemeType(v as SchemeType)
                    setAssetName(v)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PPF">Public Provident Fund (PPF)</SelectItem>
                    <SelectItem value="NPS">National Pension System (NPS)</SelectItem>
                    <SelectItem value="EPF">Employee Provident Fund (EPF)</SelectItem>
                    <SelectItem value="ELSS">Equity Linked Savings Scheme (ELSS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contribution">Contribution Amount (₹)</Label>
                <Input
                  id="contribution"
                  type="number"
                  placeholder="e.g., 12000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Contribution Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !investmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {investmentDate ? format(investmentDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={investmentDate}
                      onSelect={(d) => d && setInvestmentDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Lock-in Info */}
              <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Lock-in Period:</span>{" "}
                {SCHEME_LOCK_IN[schemeType]}
              </div>
            </>
          )}

          {assetType === "other" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="otherName">Asset Name</Label>
                <Input
                  id="otherName"
                  placeholder="e.g., Real Estate, Gold, etc."
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="otherAmount">Amount (₹)</Label>
                <Input
                  id="otherAmount"
                  type="number"
                  placeholder="e.g., 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Buy Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !investmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {investmentDate ? format(investmentDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={investmentDate}
                      onSelect={(d) => d && setInvestmentDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Adding..." : "Add Asset"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            This helps us understand your investment behavior. We don&apos;t execute trades.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
