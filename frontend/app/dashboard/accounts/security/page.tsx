"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Shield,
  Smartphone,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  AlertTriangle,
  LogOut,
  Monitor,
  Loader2,
} from "lucide-react"
import { useSecuritySettings } from "@/lib/context/security-context"

interface LoginSession {
  id: number
  device: string
  location: string
  time: string
  current: boolean
  icon: any
}

const INITIAL_LOGIN_HISTORY: LoginSession[] = [
  {
    id: 1,
    device: "Chrome on Windows",
    location: "Mumbai, India",
    time: "Just now",
    current: true,
    icon: Monitor,
  },
  {
    id: 2,
    device: "Safari on iPhone",
    location: "Mumbai, India",
    time: "2 hours ago",
    current: false,
    icon: Smartphone,
  },
  {
    id: 3,
    device: "Chrome on MacOS",
    location: "Pune, India",
    time: "Yesterday",
    current: false,
    icon: Monitor,
  },
]

export default function SecurityPage() {
  // Use shared security context for hide balances
  const { hideBalances, setHideBalances } = useSecuritySettings()

  // Security settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loginAlerts, setLoginAlerts] = useState(true)

  // Login history
  const [loginHistory, setLoginHistory] = useState<LoginSession[]>(INITIAL_LOGIN_HISTORY)
  const [signingOut, setSigningOut] = useState<number | null>(null)
  const [signingOutAll, setSigningOutAll] = useState(false)

  // Calculate security score dynamically (based on 3 settings)
  const calculateSecurityScore = () => {
    let score = 0
    let enabledCount = 0
    const totalSettings = 3

    if (twoFactorEnabled) { score += 33; enabledCount++ }
    if (hideBalances) { score += 33; enabledCount++ }
    if (loginAlerts) { score += 34; enabledCount++ }

    return { score, enabledCount, totalSettings }
  }

  const { score, enabledCount, totalSettings } = calculateSecurityScore()

  const getSecurityLevel = () => {
    if (score >= 67) return { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-400", badgeColor: "bg-emerald-500/20" }
    if (score >= 33) return { label: "Good", color: "bg-blue-500", textColor: "text-blue-400", badgeColor: "bg-blue-500/20" }
    return { label: "Fair", color: "bg-orange-500", textColor: "text-orange-400", badgeColor: "bg-orange-500/20" }
  }

  const securityLevel = getSecurityLevel()

  const handleSignOut = async (sessionId: number) => {
    setSigningOut(sessionId)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoginHistory(prev => prev.filter(s => s.id !== sessionId))
    setSigningOut(null)
  }

  const handleSignOutAll = async () => {
    setSigningOutAll(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoginHistory(prev => prev.filter(s => s.current))
    setSigningOutAll(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Security</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account security and privacy settings</p>
      </div>

      {/* Security Score */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full ${securityLevel.badgeColor} flex items-center justify-center`}>
                <Shield className={`w-10 h-10 ${securityLevel.textColor}`} />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${securityLevel.color} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{score}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">Security Score</h3>
                <Badge className={`${securityLevel.badgeColor} ${securityLevel.textColor} border-0`}>{securityLevel.label}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {enabledCount} of {totalSettings} security settings enabled
              </p>
              <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${securityLevel.color} rounded-full transition-all duration-500`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${twoFactorEnabled ? 'bg-emerald-500/20' : 'bg-gray-500/20'} flex items-center justify-center`}>
                <Smartphone className={`w-5 h-5 ${twoFactorEnabled ? 'text-emerald-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                  {twoFactorEnabled && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Enabled</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">SMS verification on login</p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>

          {/* Hide Balances */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${hideBalances ? 'bg-emerald-500/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
                {hideBalances ? (
                  <EyeOff className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Eye className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Hide Balances</p>
                  {hideBalances && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Enabled</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Mask amounts on dashboard</p>
              </div>
            </div>
            <Switch
              checked={hideBalances}
              onCheckedChange={setHideBalances}
            />
          </div>

          {/* Login Alerts */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${loginAlerts ? 'bg-emerald-500/20' : 'bg-orange-500/20'} flex items-center justify-center`}>
                <AlertTriangle className={`w-5 h-5 ${loginAlerts ? 'text-emerald-400' : 'text-orange-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Login Alerts</p>
                  {loginAlerts && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Enabled</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Get notified of new logins</p>
              </div>
            </div>
            <Switch
              checked={loginAlerts}
              onCheckedChange={setLoginAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Login Activity</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive text-xs"
            onClick={handleSignOutAll}
            disabled={signingOutAll || loginHistory.filter(s => !s.current).length === 0}
          >
            {signingOutAll ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <LogOut className="w-3 h-3 mr-1" />
            )}
            Sign out all devices
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loginHistory.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-3 rounded-lg ${session.current ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <session.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{session.device}</p>
                    {session.current && (
                      <Badge className="bg-primary text-primary-foreground text-[10px]">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.time}
                    </span>
                  </div>
                </div>
              </div>
              {!session.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive text-xs"
                  onClick={() => handleSignOut(session.id)}
                  disabled={signingOut === session.id}
                >
                  {signingOut === session.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Sign out"
                  )}
                </Button>
              )}
            </div>
          ))}

          {loginHistory.length === 1 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other active sessions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
