"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Gift,
  Users,
  Building2,
  CreditCard,
  Zap,
  RefreshCw,
  Share2,
  Settings,
  User,
  HelpCircle,
  Globe,
  ChevronRight,
  Plus,
  CheckCircle2,
  Bell,
  Shield,
  Loader2,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import {
  getPaymentMethods,
  getPaymentMethodCounts,
  addCreditCard,
  addUpiId,
  deletePaymentMethod,
  type PaymentMethodCounts,
  type BankAccount,
  type CreditCard as CreditCardType,
  type UpiAccount,
} from "@/lib/api/paymentMethods"

interface AccountsContentProps {
  user: {
    email: string
    fullName: string
    phone: string
  }
}

const menuItems = [
  {
    icon: RefreshCw,
    label: "Autopay",
    sublabel: "2 active mandates",
    href: "/dashboard/accounts/autopay",
    badge: null,
  },
  {
    icon: Bell,
    label: "Notifications",
    sublabel: "Manage your alerts and preferences",
    href: "/dashboard/accounts/notifications",
    badge: null,
  },
  {
    icon: Shield,
    label: "Security",
    sublabel: "2FA, login history, and more",
    href: "/dashboard/accounts/security",
    badge: null,
  },
  {
    icon: Settings,
    label: "Settings",
    sublabel: "App preferences and configurations",
    href: "/dashboard/settings",
    badge: null,
  },
  {
    icon: User,
    label: "Manage account",
    sublabel: "Profile, email, and password",
    href: "/dashboard/accounts/profile",
    badge: null,
  },
  {
    icon: HelpCircle,
    label: "Get help",
    sublabel: "FAQs, support, and feedback",
    href: "/dashboard/get-help",
    badge: null,
  },

]

export function AccountsContent({ user }: AccountsContentProps) {
  const [counts, setCounts] = useState<PaymentMethodCounts>({
    bankAccounts: 0,
    creditCards: 0,
    upiAccounts: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // All payment methods
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([])
  const [upiAccounts, setUpiAccounts] = useState<UpiAccount[]>([])

  // Modal states
  const [showCreditCardModal, setShowCreditCardModal] = useState(false)
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showRewardsModal, setShowRewardsModal] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Credit card form
  const [creditCardForm, setCreditCardForm] = useState({
    cardNumber: "",
    cvv: "",
    creditLimit: "",
    expiryMonth: "",
    expiryYear: "",
    cardType: "" as "visa" | "mastercard" | "rupay" | "amex" | "diners" | "discover" | "",
    cardNickname: "",
  })
  const [creditCardErrors, setCreditCardErrors] = useState<Record<string, string>>({})

  // UPI form
  const [upiForm, setUpiForm] = useState({ upiId: "" })
  const [upiErrors, setUpiErrors] = useState<Record<string, string>>({})

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Fetch payment methods on mount
  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const response = await getPaymentMethods()
      setBankAccounts(response.data.bankAccounts)
      setCreditCards(response.data.creditCards)
      setUpiAccounts(response.data.upiAccounts)
      setCounts(response.data.counts)
    } catch (error) {
      console.error("Failed to fetch payment methods:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete payment method
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deletePaymentMethod(id)
      fetchPaymentMethods()
    } catch (error) {
      console.error("Failed to delete payment method:", error)
    } finally {
      setDeletingId(null)
    }
  }

  // Calculate setup progress
  const getSetupProgress = () => {
    let progress = 0
    if (counts.bankAccounts > 0) progress++
    if (counts.creditCards > 0) progress++
    if (counts.upiAccounts > 0) progress++
    return progress
  }

  // Handle credit card submission
  const handleCreditCardSubmit = async () => {
    const errors: Record<string, string> = {}

    // Validate card number (13-19 digits)
    const cleanCardNumber = creditCardForm.cardNumber.replace(/\s/g, "")
    if (!cleanCardNumber || !/^\d{13,19}$/.test(cleanCardNumber)) {
      errors.cardNumber = "Card number must be 13-19 digits"
    }

    // Validate CVV (3-4 digits)
    if (!creditCardForm.cvv || !/^\d{3,4}$/.test(creditCardForm.cvv)) {
      errors.cvv = "CVV must be 3 or 4 digits"
    }

    // Validate credit limit
    const limitNum = Number(creditCardForm.creditLimit)
    if (!creditCardForm.creditLimit || isNaN(limitNum) || limitNum < 1000 || limitNum > 10000000) {
      errors.creditLimit = "Enter limit between ₹1,000 and ₹1,00,00,000"
    }

    // Validate expiry month
    const monthNum = Number(creditCardForm.expiryMonth)
    if (!creditCardForm.expiryMonth || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      errors.expiryMonth = "Enter month (1-12)"
    }

    // Validate expiry year
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const yearNum = Number(creditCardForm.expiryYear)
    if (!creditCardForm.expiryYear || isNaN(yearNum) || yearNum < currentYear || yearNum > 2050) {
      errors.expiryYear = "Enter valid year"
    }

    // Check if card is expired
    if (!errors.expiryMonth && !errors.expiryYear && yearNum === currentYear && monthNum < currentMonth) {
      errors.expiryMonth = "Card expired"
    }

    // Validate card type
    if (!creditCardForm.cardType) {
      errors.cardType = "Select card type"
    }

    setCreditCardErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      await addCreditCard({
        cardNumber: cleanCardNumber,
        cvv: creditCardForm.cvv,
        creditLimit: limitNum,
        expiryMonth: monthNum,
        expiryYear: yearNum,
        cardType: creditCardForm.cardType as "visa" | "mastercard" | "rupay" | "amex" | "diners" | "discover",
        cardNickname: creditCardForm.cardNickname || undefined,
      })
      setShowCreditCardModal(false)
      setCreditCardForm({
        cardNumber: "",
        cvv: "",
        creditLimit: "",
        expiryMonth: "",
        expiryYear: "",
        cardType: "",
        cardNickname: "",
      })
      fetchPaymentMethods()
    } catch (error) {
      console.error("Failed to add credit card:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle UPI submission
  const handleUpiSubmit = async () => {
    const errors: Record<string, string> = {}

    if (!upiForm.upiId || !/^[\w.-]+@[\w]+$/.test(upiForm.upiId)) {
      errors.upiId = "Enter a valid UPI ID (e.g., user@upi)"
    }

    setUpiErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      await addUpiId(upiForm.upiId)
      setShowUpiModal(false)
      setUpiForm({ upiId: "" })
      fetchPaymentMethods()
    } catch (error) {
      console.error("Failed to add UPI ID:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentMethods = [
    {
      icon: Building2,
      label: "Bank account",
      sublabel: counts.bankAccounts > 0 ? `${counts.bankAccounts} account${counts.bankAccounts > 1 ? "s" : ""}` : "Add account",
      connected: counts.bankAccounts > 0,
      color: "text-foreground",
      bgColor: "bg-secondary",
      onClick: () => {
        // Navigate to connect bank page
        window.location.href = "/dashboard/connect-bank"
      },
    },
    {
      icon: CreditCard,
      label: "Credit card",
      sublabel: counts.creditCards > 0 ? `${counts.creditCards} card${counts.creditCards > 1 ? "s" : ""}` : "Add card",
      connected: counts.creditCards > 0,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      onClick: () => setShowCreditCardModal(true),
    },
    {
      icon: Zap,
      label: "UPI Lite",
      sublabel: counts.upiAccounts > 0 ? `${counts.upiAccounts} ID${counts.upiAccounts > 1 ? "s" : ""}` : "Pay PIN-free",
      connected: counts.upiAccounts > 0,
      color: "text-primary",
      bgColor: "bg-primary/20",
      onClick: () => setShowUpiModal(true),
    },
  ]

  const setupProgress = getSetupProgress()

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="relative mb-6 rounded-xl overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-card to-secondary opacity-50" />
        <div className="absolute top-4 right-20 w-16 h-16 rounded-full bg-primary/10" />
        <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-primary/20" />
        <div className="absolute bottom-4 left-8 w-12 h-8 bg-primary/10 rounded-lg" />

        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{user.fullName}</h1>
              <p className="text-muted-foreground text-sm">UPI ID: {user.email.split("@")[0]}@financebank</p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{user.phone}</span>
                <Badge className="bg-primary/20 text-primary border-0 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Promo Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card
          className="bg-purple-900/30 border-purple-800/50 hover:bg-purple-900/40 transition-colors cursor-pointer"
          onClick={() => setShowRewardsModal(true)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <p className="font-semibold text-purple-200">Rewards</p>
              <p className="text-xs text-purple-300/70">View all</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-teal-900/30 border-teal-800/50 hover:bg-teal-900/40 transition-colors cursor-pointer"
          onClick={() => setShowReferralModal(true)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <p className="font-semibold text-teal-200">Referral Bonus</p>
              <p className="text-xs text-teal-300/70">Earn rewards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Setup */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              Set up payment methods{" "}
              <span className="text-foreground font-medium">
                {isLoading ? "..." : `${setupProgress}/${paymentMethods.length}`}
              </span>
            </p>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.label}
                className="flex flex-col items-center text-center group"
                onClick={method.onClick}
              >
                <div className="relative mb-2">
                  <div
                    className={`w-14 h-14 rounded-full ${method.bgColor} flex items-center justify-center ${!method.connected ? "border-2 border-dashed border-muted-foreground/30" : ""
                      } transition-transform group-hover:scale-105`}
                  >
                    <method.icon className={`w-6 h-6 ${method.color}`} />
                  </div>
                  {!method.connected && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Plus className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  {method.connected && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-foreground font-medium">{method.label}</p>
                <p className="text-xs text-muted-foreground">{method.sublabel}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit Card Modal */}
      <Dialog open={showCreditCardModal} onOpenChange={setShowCreditCardModal}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border p-4 mx-auto">
          <DialogHeader className="pb-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-sm">Add Credit Card</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Enter your card details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 mt-1">
            {/* Card Number */}
            <div className="space-y-1">
              <Label className="text-foreground text-sm">Card Number</Label>
              <Input
                placeholder="1234 5678 9012 3456"
                value={creditCardForm.cardNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 19)
                  setCreditCardForm({ ...creditCardForm, cardNumber: val })
                  if (creditCardErrors.cardNumber) {
                    setCreditCardErrors({ ...creditCardErrors, cardNumber: "" })
                  }
                }}
                className={`bg-secondary/50 border-border h-9 text-sm ${creditCardErrors.cardNumber ? "border-red-500" : ""}`}
                maxLength={19}
              />
              {creditCardErrors.cardNumber && (
                <p className="text-xs text-red-500">{creditCardErrors.cardNumber}</p>
              )}
            </div>

            {/* CVV and Credit Limit Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground text-sm">CVV</Label>
                <Input
                  type="password"
                  placeholder="***"
                  value={creditCardForm.cvv}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4)
                    setCreditCardForm({ ...creditCardForm, cvv: val })
                    if (creditCardErrors.cvv) {
                      setCreditCardErrors({ ...creditCardErrors, cvv: "" })
                    }
                  }}
                  className={`bg-secondary/50 border-border h-9 text-sm ${creditCardErrors.cvv ? "border-red-500" : ""}`}
                  maxLength={4}
                />
                {creditCardErrors.cvv && (
                  <p className="text-xs text-red-500">{creditCardErrors.cvv}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-foreground text-sm">Credit Limit (₹)</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={creditCardForm.creditLimit}
                  onChange={(e) => {
                    setCreditCardForm({ ...creditCardForm, creditLimit: e.target.value })
                    if (creditCardErrors.creditLimit) {
                      setCreditCardErrors({ ...creditCardErrors, creditLimit: "" })
                    }
                  }}
                  className={`bg-secondary/50 border-border h-9 text-sm ${creditCardErrors.creditLimit ? "border-red-500" : ""}`}
                />
                {creditCardErrors.creditLimit && (
                  <p className="text-xs text-red-500">{creditCardErrors.creditLimit}</p>
                )}
              </div>
            </div>

            {/* Expiry Date Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-foreground text-xs">Expiry Month</Label>
                <Select
                  value={creditCardForm.expiryMonth}
                  onValueChange={(val) => {
                    setCreditCardForm({ ...creditCardForm, expiryMonth: val })
                    if (creditCardErrors.expiryMonth) {
                      setCreditCardErrors({ ...creditCardErrors, expiryMonth: "" })
                    }
                  }}
                >
                  <SelectTrigger className={`bg-secondary/50 border-border h-8 text-xs ${creditCardErrors.expiryMonth ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {creditCardErrors.expiryMonth && (
                  <p className="text-xs text-red-500">{creditCardErrors.expiryMonth}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-foreground text-xs">Expiry Year</Label>
                <Input
                  type="number"
                  placeholder="2026"
                  value={creditCardForm.expiryYear}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4)
                    setCreditCardForm({ ...creditCardForm, expiryYear: val })
                    if (creditCardErrors.expiryYear) {
                      setCreditCardErrors({ ...creditCardErrors, expiryYear: "" })
                    }
                  }}
                  className={`bg-secondary/50 border-border h-8 text-xs ${creditCardErrors.expiryYear ? "border-red-500" : ""}`}
                  maxLength={4}
                />
                {creditCardErrors.expiryYear && (
                  <p className="text-xs text-red-500">{creditCardErrors.expiryYear}</p>
                )}
              </div>
            </div>

            {/* Card Type */}
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Card Type</Label>
              <Select
                value={creditCardForm.cardType}
                onValueChange={(val) => {
                  setCreditCardForm({ ...creditCardForm, cardType: val as typeof creditCardForm.cardType })
                  if (creditCardErrors.cardType) {
                    setCreditCardErrors({ ...creditCardErrors, cardType: "" })
                  }
                }}
              >
                <SelectTrigger className={`bg-secondary/50 border-border h-8 text-xs ${creditCardErrors.cardType ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select card type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="rupay">RuPay</SelectItem>
                  <SelectItem value="amex">American Express (Amex)</SelectItem>
                  <SelectItem value="diners">Diners Club</SelectItem>
                  <SelectItem value="discover">Discover</SelectItem>
                </SelectContent>
              </Select>
              {creditCardErrors.cardType && (
                <p className="text-xs text-red-500">{creditCardErrors.cardType}</p>
              )}
            </div>

            {/* Card Nickname (optional) */}
            <div className="space-y-1">
              <Label className="text-foreground text-sm">Nickname (optional)</Label>
              <Input
                placeholder="e.g., My Rewards Card"
                value={creditCardForm.cardNickname}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, cardNickname: e.target.value })}
                className="bg-secondary/50 border-border h-9 text-sm"
                maxLength={50}
              />
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-xs text-muted-foreground">Your card details are encrypted and secure</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreditCardModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreditCardSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Card"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPI Modal */}
      <Dialog open={showUpiModal} onOpenChange={setShowUpiModal}>
        <DialogContent className="sm:max-w-[380px] bg-card border-border p-5">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-base">Add UPI ID</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Link your UPI for quick payments
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* UPI ID */}
            <div className="space-y-1">
              <Label className="text-foreground text-sm">UPI ID</Label>
              <Input
                placeholder="e.g., username@upi"
                value={upiForm.upiId}
                onChange={(e) => {
                  setUpiForm({ upiId: e.target.value.toLowerCase() })
                  if (upiErrors.upiId) {
                    setUpiErrors({ upiId: "" })
                  }
                }}
                className={`bg-secondary/50 border-border h-9 text-sm ${upiErrors.upiId ? "border-red-500" : ""}`}
              />
              {upiErrors.upiId && <p className="text-xs text-red-500">{upiErrors.upiId}</p>}
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">UPI Lite allows PIN-free payments up to ₹500</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowUpiModal(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleUpiSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add UPI"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Linked Accounts Summary */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Linked Accounts</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary text-xs"
              onClick={() => setShowManageModal(true)}
            >
              Manage <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {counts.bankAccounts === 0 && counts.creditCards === 0 && counts.upiAccounts === 0 ? (
            <div className="text-center py-6">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No payment methods linked</p>
              <p className="text-xs text-muted-foreground mt-1">Add a bank, card, or UPI to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Bank Accounts */}
              {bankAccounts.map((bank) => (
                <div key={bank.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{bank.bankName || "Bank Account"}</p>
                      <p className="text-xs text-muted-foreground">{bank.accountNumber}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-[10px]">Bank</Badge>
                </div>
              ))}

              {/* Credit Cards */}
              {creditCards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {card.cardNickname || `${card.cardType.charAt(0).toUpperCase() + card.cardType.slice(1)} Card`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {card.cardNumberMasked} • Limit: ₹{card.creditLimit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-[10px]">Card</Badge>
                </div>
              ))}

              {/* UPI Accounts */}
              {upiAccounts.map((upi) => (
                <div key={upi.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">UPI Lite</p>
                      <p className="text-xs text-muted-foreground">{upi.upiId}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">UPI</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Payment Methods Modal */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border p-5">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-foreground">Manage Payment Methods</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Remove linked accounts, cards, or UPI IDs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-2 max-h-[400px] overflow-y-auto">
            {counts.bankAccounts === 0 && counts.creditCards === 0 && counts.upiAccounts === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No payment methods to manage</p>
            ) : (
              <>
                {/* Bank Accounts */}
                {bankAccounts.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{bank.bankName || "Bank Account"}</p>
                          <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-[9px] px-1">Bank</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{bank.accountNumber}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                      onClick={() => handleDelete(bank.id)}
                      disabled={deletingId === bank.id}
                    >
                      {deletingId === bank.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}

                {/* Credit Cards */}
                {creditCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {card.cardNickname || `${card.cardType.charAt(0).toUpperCase() + card.cardType.slice(1)} Card`}
                          </p>
                          <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-[9px] px-1">Card</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{card.cardNumberMasked}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                      onClick={() => handleDelete(card.id)}
                      disabled={deletingId === card.id}
                    >
                      {deletingId === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}

                {/* UPI Accounts */}
                {upiAccounts.map((upi) => (
                  <div key={upi.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">UPI Lite</p>
                          <Badge variant="outline" className="text-primary border-primary/30 text-[9px] px-1">UPI</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{upi.upiId}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                      onClick={() => handleDelete(upi.id)}
                      disabled={deletingId === upi.id}
                    >
                      {deletingId === upi.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="pt-2">
            <Button className="w-full" onClick={() => setShowManageModal(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Menu Items */}
      <Card className="bg-card border-border">
        <CardContent className="p-2">
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors ${index !== menuItems.length - 1 ? "border-b border-border/50" : ""
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {item.badge && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">{item.badge}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Rewards Modal */}
      <Dialog open={showRewardsModal} onOpenChange={setShowRewardsModal}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border p-4 mx-auto">
          <DialogHeader className="pb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Gift className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-sm">Your Rewards</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Earn rewards for using the app
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 mt-1 max-h-[350px] overflow-y-auto">
            {/* Available Rewards */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Available Rewards</p>

              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Welcome Bonus</p>
                      <p className="text-xs text-muted-foreground">Complete profile setup</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-[10px]">₹50</Badge>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">First Transaction</p>
                      <p className="text-xs text-muted-foreground">Link bank & add transaction</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-[10px]">₹100</Badge>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Budget Master</p>
                      <p className="text-xs text-muted-foreground">Set up your first budget</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-[10px]">₹75</Badge>
                </div>
              </div>
            </div>

            {/* Claimed Rewards */}
            <div className="space-y-2 mt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Claimed Rewards</p>

              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Account Created</p>
                      <p className="text-xs text-muted-foreground">Join FinanceHub</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">₹25</Badge>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Bank Linked</p>
                      <p className="text-xs text-muted-foreground">Connect your first bank</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">₹50</Badge>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 mt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Total Earned</p>
                <p className="text-lg font-bold text-primary">₹75</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">₹225 available to claim</p>
            </div>
          </div>

          <div className="pt-1">
            <Button className="w-full" onClick={() => setShowRewardsModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Bonus Modal */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border p-4 mx-auto">
          <DialogHeader className="pb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-sm">Referral Bonus</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Earn ₹201 for each friend you refer
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2.5 mt-1">
            {/* Referral Stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-center">
                <p className="text-xl font-bold text-teal-400">3</p>
                <p className="text-xs text-muted-foreground">Friends Joined</p>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-center">
                <p className="text-xl font-bold text-teal-400">₹603</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>

            {/* How it works */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm font-semibold text-foreground mb-2">How it works</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-primary">1</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Share your referral code with friends</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-primary">2</span>
                  </div>
                  <p className="text-xs text-muted-foreground">They sign up and link their bank</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-primary">3</span>
                  </div>
                  <p className="text-xs text-muted-foreground">You both get ₹201 bonus!</p>
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1.5">Your Referral Code</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-base font-bold text-primary">FINANCE2026</code>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Share2 className="w-3 h-3 mr-1.5" />
                  Share
                </Button>
              </div>
            </div>

            {/* Recent Referrals */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground uppercase">Recent Referrals</p>

              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Priya S.</p>
                      <p className="text-xs text-muted-foreground">Joined 2 days ago</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">₹201</Badge>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Rahul K.</p>
                      <p className="text-xs text-muted-foreground">Joined 5 days ago</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">₹201</Badge>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Amit P.</p>
                      <p className="text-xs text-muted-foreground">Joined 1 week ago</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">₹201</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <Button className="w-full" onClick={() => setShowReferralModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* App Info */}
      <div className="text-center mt-6 mb-4">
        <p className="text-xs text-muted-foreground">FinanceHub v1.0.0</p>
        <p className="text-xs text-muted-foreground mt-1">Made with care in India</p>
      </div>
    </div>
  )
}

