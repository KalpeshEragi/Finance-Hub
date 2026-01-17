"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  RefreshCw,
  Plus,
  Building2,
  Wifi,
  Smartphone,
  CreditCard,
  Calendar,
  IndianRupee,
  Tv,
  Home,
  Zap,
  ShoppingBag,
  Music,
  Loader2,
} from "lucide-react"

interface Mandate {
  id: number
  name: string
  category: string
  amount: number
  paymentSource: string
  status: "active" | "paused"
  nextDate: string
}

const INITIAL_MANDATES: Mandate[] = [
  {
    id: 1,
    name: "Netflix",
    category: "Entertainment",
    amount: 649,
    paymentSource: "HDFC Bank ••4832",
    status: "active",
    nextDate: "25 Jan 2026",
  },
  {
    id: 2,
    name: "Airtel Postpaid",
    category: "Mobile",
    amount: 999,
    paymentSource: "ICICI Bank ••1994",
    status: "active",
    nextDate: "1 Feb 2026",
  },
  {
    id: 3,
    name: "Amazon Prime",
    category: "Entertainment",
    amount: 1499,
    paymentSource: "HDFC Bank ••4832",
    status: "paused",
    nextDate: "15 Mar 2026",
  },
]

const CATEGORY_ICONS: Record<string, any> = {
  Entertainment: Tv,
  Mobile: Smartphone,
  Utilities: Zap,
  Shopping: ShoppingBag,
  Music: Music,
  Broadband: Wifi,
  Other: CreditCard,
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Entertainment: { bg: "bg-purple-500/20", text: "text-purple-400" },
  Mobile: { bg: "bg-blue-500/20", text: "text-blue-400" },
  Utilities: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  Shopping: { bg: "bg-green-500/20", text: "text-green-400" },
  Music: { bg: "bg-pink-500/20", text: "text-pink-400" },
  Broadband: { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  Other: { bg: "bg-gray-500/20", text: "text-gray-400" },
}

export default function AutopayPage() {
  const [mandates, setMandates] = useState<Mandate[]>(INITIAL_MANDATES)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    amount: "",
    paymentSource: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Calculate dynamic stats
  const activeCount = mandates.filter(m => m.status === "active").length
  const pausedCount = mandates.filter(m => m.status === "paused").length
  const thisMonthTotal = mandates
    .filter(m => m.status === "active")
    .reduce((sum, m) => sum + m.amount, 0)

  const handleToggleStatus = (id: number) => {
    setMandates(mandates.map(m =>
      m.id === id
        ? { ...m, status: m.status === "active" ? "paused" : "active" }
        : m
    ))
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Mandate name is required"
    }

    if (!formData.category) {
      errors.category = "Please select a category"
    }

    if (!formData.amount) {
      errors.amount = "Amount is required"
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = "Enter a valid amount"
    }

    if (!formData.paymentSource.trim()) {
      errors.paymentSource = "Payment source is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddMandate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newMandate: Mandate = {
      id: Math.max(...mandates.map(m => m.id), 0) + 1,
      name: formData.name,
      category: formData.category,
      amount: Number(formData.amount),
      paymentSource: formData.paymentSource,
      status: "active",
      nextDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
    }

    setMandates([...mandates, newMandate])
    setShowAddModal(false)
    setFormData({ name: "", category: "", amount: "", paymentSource: "" })
    setFormErrors({})
    setIsSubmitting(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Autopay</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your recurring payment mandates</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Mandate
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pausedCount}</p>
              <p className="text-xs text-muted-foreground">Paused</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">₹{thisMonthTotal.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mandates List */}
      <div className="space-y-3">
        {mandates.map((mandate) => {
          const Icon = CATEGORY_ICONS[mandate.category] || CreditCard
          const colors = CATEGORY_COLORS[mandate.category] || CATEGORY_COLORS.Other

          return (
            <Card key={mandate.id} className="bg-card border-border hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{mandate.name}</p>
                        <Badge
                          variant="outline"
                          className={
                            mandate.status === "active"
                              ? "text-emerald-400 border-emerald-400/30"
                              : "text-orange-400 border-orange-400/30"
                          }
                        >
                          {mandate.status === "active" ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{mandate.category}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {mandate.paymentSource}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {mandate.nextDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {mandate.amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">Monthly</p>
                    </div>
                    <Switch
                      checked={mandate.status === "active"}
                      onCheckedChange={() => handleToggleStatus(mandate.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Mandate Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border p-4 mx-auto">
          <DialogHeader className="pb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-sm">Add New Mandate</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Set up a recurring payment mandate
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Mandate Name */}
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Mandate Name</Label>
              <Input
                placeholder="e.g., Netflix, Spotify"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`bg-secondary/50 border-border h-8 text-sm ${formErrors.name ? "border-red-500" : ""}`}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Category</Label>
              <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                <SelectTrigger className={`bg-secondary/50 border-border h-8 text-sm ${formErrors.category ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Broadband">Broadband</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.category && (
                <p className="text-xs text-red-500">{formErrors.category}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Monthly Amount (₹)</Label>
              <Input
                type="number"
                placeholder="e.g., 649"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={`bg-secondary/50 border-border h-8 text-sm ${formErrors.amount ? "border-red-500" : ""}`}
              />
              {formErrors.amount && (
                <p className="text-xs text-red-500">{formErrors.amount}</p>
              )}
            </div>

            {/* Payment Source */}
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Payment Source</Label>
              <Input
                placeholder="e.g., HDFC Bank ••4832"
                value={formData.paymentSource}
                onChange={(e) => handleInputChange("paymentSource", e.target.value)}
                className={`bg-secondary/50 border-border h-8 text-sm ${formErrors.paymentSource ? "border-red-500" : ""}`}
              />
              {formErrors.paymentSource && (
                <p className="text-xs text-red-500">{formErrors.paymentSource}</p>
              )}
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">New mandates are set to Active by default</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false)
                setFormData({ name: "", category: "", amount: "", paymentSource: "" })
                setFormErrors({})
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddMandate}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Mandate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="bg-primary/10 border-primary/30 mt-6">
        <CardContent className="p-4 flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">About Autopay</p>
            <p className="text-xs text-muted-foreground mt-1">
              Autopay mandates allow merchants to automatically debit your account for recurring payments. You can pause
              or cancel any mandate at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
