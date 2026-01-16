"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  Tags,
  RefreshCw,
  Compass,
  HelpCircle,
  Settings,
  Receipt,
  PiggyBank,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserMenu } from "./user-menu"

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transactions", href: "/dashboard/transactions" },
  { icon: Wallet, label: "Accounts", href: "/dashboard/accounts" },
  { icon: TrendingUp, label: "Investments", href: "/dashboard/investments" },
  { icon: Tags, label: "Categories", href: "/dashboard/categories" },
  { icon: RefreshCw, label: "Recurrings", href: "/dashboard/recurrings" },
  { icon: Receipt, label: "Tax Center", href: "/dashboard/tax" },
  { icon: PiggyBank, label: "Goals", href: "/dashboard/goals" },
  { icon: Shield, label: "Emergency Fund", href: "/dashboard/emergency-fund" },
]

const creditCards = [
  { name: "HDFC Card", last4: "4832", color: "bg-blue-500" },
  { name: "ICICI Rewards", last4: "1994", balance: "₹41,994", color: "bg-emerald-500" },
]

const bottomNavItems = [
  { icon: Compass, label: "Explore", href: "/dashboard/explore" },
  { icon: HelpCircle, label: "Get help", href: "/dashboard/help" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

interface SidebarProps {
  user?: {
    email?: string
    fullName?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="p-3 border-b border-sidebar-border">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">₹</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">FinanceHub</span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-4">
          <p className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">Credit cards</p>
          {creditCards.map((card) => (
            <div
              key={card.last4}
              className="flex items-center justify-between px-3 py-2 text-sm text-sidebar-foreground/70"
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", card.color)} />
                <span>{card.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{card.balance || `••${card.last4}`}</span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <p className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">Depository</p>
          <p className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2 mt-4">Investment</p>
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
