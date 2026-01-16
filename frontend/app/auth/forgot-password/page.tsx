"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { validateEmail } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors([])

    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setFieldErrors(emailValidation.errors)
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implement password reset API endpoint in backend
      // For now, simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">₹</span>
            </div>
            <span className="text-2xl font-semibold text-foreground">FinanceHub</span>
          </div>

          <Card className="border-border bg-card text-center">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-card-foreground">Check your email</CardTitle>
              <CardDescription className="text-muted-foreground">
                We&apos;ve sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted bg-transparent"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">₹</span>
          </div>
          <span className="text-2xl font-semibold text-foreground">FinanceHub</span>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-card-foreground">Forgot password?</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-input border-border text-foreground placeholder:text-muted-foreground ${fieldErrors.length > 0 ? "border-destructive" : ""
                    }`}
                  disabled={isLoading}
                />
                {fieldErrors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {err}
                  </p>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>

              <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
