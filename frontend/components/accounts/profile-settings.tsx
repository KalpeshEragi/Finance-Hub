"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Camera, Mail, Phone, User, Lock, CheckCircle2, AlertCircle, Smartphone, Shield } from "lucide-react"

interface ProfileSettingsProps {
  user: {
    email: string
    fullName: string
    phone: string
  }
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user.fullName)
  const [phone, setPhone] = useState(user.phone)
  const [isLoading, setIsLoading] = useState(false)

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleSave = async () => {
    setIsLoading(true)

    // TODO: Implement profile update API endpoint in backend
    // For now, just simulate a save
    await new Promise(resolve => setTimeout(resolve, 500))

    setIsLoading(false)
    setIsEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information and preferences</p>
      </div>

      {/* Profile Photo */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center hover:bg-secondary/80 transition-colors">
                <Camera className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">{user.fullName}</h3>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-0">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified Account
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : isEditing ? "Save" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-muted-foreground text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            {isEditing ? (
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <p className="text-foreground py-2">{user.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <div className="flex items-center gap-2">
              <p className="text-foreground py-2">{user.email}</p>
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">
                Verified
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-muted-foreground text-sm flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            {isEditing ? (
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-secondary border-border"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-foreground py-2">{user.phone || "Not set"}</p>
                {user.phone && (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
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
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Login Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified of new logins</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
