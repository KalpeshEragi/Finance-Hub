"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Camera,
  Mail,
  Phone,
  User,
  Lock,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle
} from "lucide-react"

interface ProfileSettingsProps {
  user: {
    email: string
    fullName: string
    phone: string
  }
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user.fullName)
  const [phone, setPhone] = useState(user.phone)
  const [isLoading, setIsLoading] = useState(false)

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleSave = async () => {
    setIsLoading(true)
    // TODO: Implement profile update API endpoint
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
    setIsEditing(false)
  }

  // Password validation
  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {}

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required"
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required"
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters"
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordChange = async () => {
    if (!validatePassword()) return

    setIsPasswordSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setPasswordChanged(true)
    setShowPasswordModal(false)
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setPasswordErrors({})
    setIsPasswordSubmitting(false)
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    // Simulate DELETE request
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Clear auth and redirect
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/auth/login')
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
              <h3 className="font-semibold text-foreground text-lg">{fullName}</h3>
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
              <p className="text-foreground py-2">{fullName}</p>
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
                <p className="text-foreground py-2">{phone || "Not set"}</p>
                {phone && (
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
              <div className={`w-10 h-10 rounded-lg ${passwordChanged ? 'bg-emerald-500/20' : 'bg-primary/20'} flex items-center justify-center`}>
                <Lock className={`w-5 h-5 ${passwordChanged ? 'text-emerald-400' : 'text-primary'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Password</p>
                  {passwordChanged && <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">Updated</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {passwordChanged ? "Changed just now" : "Last changed 30 days ago"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
              Change
            </Button>
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
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border p-4 mx-auto">
          <DialogHeader className="pb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-sm">Change Password</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Enter your current password and choose a new one
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Current Password */}
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => {
                    setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors(prev => ({ ...prev, currentPassword: "" }))
                    }
                  }}
                  className={`bg-secondary/50 border-border h-8 text-sm pr-10 ${passwordErrors.currentPassword ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-red-500">{passwordErrors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <Label className="text-foreground text-xs">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))
                    if (passwordErrors.newPassword) {
                      setPasswordErrors(prev => ({ ...prev, newPassword: "" }))
                    }
                  }}
                  className={`bg-secondary/50 border-border h-8 text-sm pr-10 ${passwordErrors.newPassword ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-500">{passwordErrors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => {
                  setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors(prev => ({ ...prev, confirmPassword: "" }))
                  }
                }}
                className={`bg-secondary/50 border-border h-8 text-sm ${passwordErrors.confirmPassword ? "border-red-500" : ""}`}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="p-2 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowPasswordModal(false)
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                setPasswordErrors({})
              }}
              disabled={isPasswordSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handlePasswordChange}
              disabled={isPasswordSubmitting}
            >
              {isPasswordSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <DialogTitle className="text-foreground">Delete Account</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all your data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
