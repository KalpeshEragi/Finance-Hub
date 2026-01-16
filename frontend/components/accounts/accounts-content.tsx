"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import Link from "next/link"

interface AccountsContentProps {
  user: {
    email: string
    fullName: string
    phone: string
  }
}

const paymentMethods = [
  {
    icon: Building2,
    label: "Bank account",
    sublabel: "2 accounts",
    connected: true,
    color: "text-foreground",
    bgColor: "bg-secondary",
  },
  {
    icon: CreditCard,
    label: "Credit card",
    sublabel: "Add card",
    connected: false,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  {
    icon: Zap,
    label: "UPI Lite",
    sublabel: "Pay PIN-free",
    connected: false,
    color: "text-primary",
    bgColor: "bg-primary/20",
  },
]

const menuItems = [
  {
    icon: RefreshCw,
    label: "Autopay",
    sublabel: "2 active mandates",
    href: "/dashboard/accounts/autopay",
    badge: null,
  },
  {
    icon: Share2,
    label: "UPI Circle",
    sublabel: "Help people you trust make UPI payments",
    href: "/dashboard/accounts/upi-circle",
    badge: "New",
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
    href: "/dashboard/help",
    badge: null,
  },
  {
    icon: Globe,
    label: "Language",
    sublabel: "English",
    href: "/dashboard/accounts/language",
    badge: null,
  },
]

export function AccountsContent({ user }: AccountsContentProps) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const setupProgress = paymentMethods.filter((m) => m.connected).length

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
        <Card className="bg-purple-900/30 border-purple-800/50 hover:bg-purple-900/40 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <p className="font-semibold text-purple-200">20 rewards</p>
              <p className="text-xs text-purple-300/70">View now</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-teal-900/30 border-teal-800/50 hover:bg-teal-900/40 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <p className="font-semibold text-teal-200">Get ₹201</p>
              <p className="text-xs text-teal-300/70">Refer a friend</p>
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
                {setupProgress}/{paymentMethods.length}
              </span>
            </p>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <button key={method.label} className="flex flex-col items-center text-center group">
                <div className="relative mb-2">
                  <div
                    className={`w-14 h-14 rounded-full ${method.bgColor} flex items-center justify-center ${
                      !method.connected ? "border-2 border-dashed border-muted-foreground/30" : ""
                    }`}
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

      {/* Linked Accounts Summary */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Linked Accounts</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs">
              Manage <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">HDFC Bank</p>
                  <p className="text-xs text-muted-foreground">••••4832 · Savings</p>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                Primary
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">ICICI Bank</p>
                  <p className="text-xs text-muted-foreground">••••1994 · Savings</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">₹41,994</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card className="bg-card border-border">
        <CardContent className="p-2">
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-border/50" : ""
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

      {/* App Info */}
      <div className="text-center mt-6 mb-4">
        <p className="text-xs text-muted-foreground">FinanceHub v1.0.0</p>
        <p className="text-xs text-muted-foreground mt-1">Made with care in India</p>
      </div>
    </div>
  )
}
