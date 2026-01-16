"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { RefreshCw, Plus, Building2, Wifi, Smartphone, CreditCard, Calendar, IndianRupee } from "lucide-react"

const autopayMandates = [
  {
    id: 1,
    name: "Netflix",
    type: "Entertainment",
    icon: Wifi,
    amount: 649,
    frequency: "Monthly",
    nextDate: "25 Jan 2026",
    bank: "HDFC Bank ••4832",
    status: "active",
    color: "bg-red-500/20",
    iconColor: "text-red-400",
  },
  {
    id: 2,
    name: "Airtel Postpaid",
    type: "Mobile",
    icon: Smartphone,
    amount: 999,
    frequency: "Monthly",
    nextDate: "1 Feb 2026",
    bank: "ICICI Bank ••1994",
    status: "active",
    color: "bg-red-500/20",
    iconColor: "text-red-400",
  },
  {
    id: 3,
    name: "Amazon Prime",
    type: "Entertainment",
    icon: CreditCard,
    amount: 1499,
    frequency: "Yearly",
    nextDate: "15 Mar 2026",
    bank: "HDFC Bank ••4832",
    status: "paused",
    color: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
]

export default function AutopayPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Autopay</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your recurring payment mandates</p>
        </div>
        <Button className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add Mandate
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">2</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">Paused</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">₹1,648</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mandates List */}
      <div className="space-y-3">
        {autopayMandates.map((mandate) => (
          <Card key={mandate.id} className="bg-card border-border hover:bg-card/80 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${mandate.color} flex items-center justify-center`}>
                    <mandate.icon className={`w-6 h-6 ${mandate.iconColor}`} />
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
                    <p className="text-xs text-muted-foreground">{mandate.type}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {mandate.bank}
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
                    <p className="text-xs text-muted-foreground">{mandate.frequency}</p>
                  </div>
                  <Switch checked={mandate.status === "active"} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
