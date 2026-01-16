"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Shield,
  Smartphone,
  Key,
  Lock,
  Eye,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Monitor,
} from "lucide-react"

const loginHistory = [
  {
    device: "Chrome on Windows",
    location: "Mumbai, India",
    time: "Just now",
    current: true,
    icon: Monitor,
  },
  {
    device: "Safari on iPhone",
    location: "Mumbai, India",
    time: "2 hours ago",
    current: false,
    icon: Smartphone,
  },
  {
    device: "Chrome on MacOS",
    location: "Pune, India",
    time: "Yesterday",
    current: false,
    icon: Monitor,
  },
]

export default function SecurityPage() {
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
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">Security Score</h3>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Strong</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Your account security is excellent. All recommended settings are enabled.
              </p>
              <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-emerald-500 rounded-full" />
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
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Enabled</Badge>
                </div>
                <p className="text-xs text-muted-foreground">SMS verification on login</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Biometric Login</p>
                <p className="text-xs text-muted-foreground">Use fingerprint or face ID</p>
              </div>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Hide Balances</p>
                <p className="text-xs text-muted-foreground">Mask amounts on dashboard</p>
              </div>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Login Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified of new logins</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Login Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-destructive text-xs">
            <LogOut className="w-3 h-3 mr-1" />
            Sign out all devices
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loginHistory.map((session, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                session.current ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
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
                <Button variant="ghost" size="sm" className="text-destructive text-xs">
                  Sign out
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
