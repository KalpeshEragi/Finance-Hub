"use client"

import { getPasswordStrength } from "@/lib/validations/auth"

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password)

  if (!password) return null

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= strength.score ? strength.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs ${
          strength.label === "Weak" ? "text-destructive" : strength.label === "Medium" ? "text-warning" : "text-success"
        }`}
      >
        Password strength: {strength.label}
      </p>
    </div>
  )
}
