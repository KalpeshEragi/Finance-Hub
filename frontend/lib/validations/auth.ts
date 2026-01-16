export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []

  if (!email) {
    errors.push("Email is required")
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Please enter a valid email address")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []

  if (!password) {
    errors.push("Password is required")
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateName(name: string): ValidationResult {
  const errors: string[] = []

  if (!name) {
    errors.push("Full name is required")
  } else if (name.length < 2) {
    errors.push("Name must be at least 2 characters")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: "Weak", color: "bg-destructive" }
  if (score <= 4) return { score, label: "Medium", color: "bg-warning" }
  return { score, label: "Strong", color: "bg-success" }
}
