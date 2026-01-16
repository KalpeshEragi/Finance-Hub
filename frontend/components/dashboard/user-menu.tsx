"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Settings, LogOut, Loader2 } from "lucide-react"

// Cookie utility for deleting auth token
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

interface UserMenuProps {
  user: {
    email?: string
    fullName?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)

    // Clear auth token cookie
    deleteCookie('auth_token')

    router.push("/auth/login")
    router.refresh()
  }

  const initials = user.fullName
    ? user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-sidebar-accent/50 transition-colors text-left">
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.fullName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-popover border-border">
        <DropdownMenuLabel className="text-foreground">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
