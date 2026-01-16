import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
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
              We&apos;ve sent you a confirmation link to verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to activate your account and start managing your finances.
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <Link href="/auth/sign-up" className="text-primary hover:text-primary/80">
                try again
              </Link>
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted bg-transparent"
            >
              <Link href="/auth/login">
                Go to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
