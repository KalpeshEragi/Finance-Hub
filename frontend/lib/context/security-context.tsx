"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface SecurityContextType {
    hideBalances: boolean
    setHideBalances: (value: boolean) => void
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export function SecurityProvider({ children }: { children: ReactNode }) {
    const [hideBalances, setHideBalances] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("hideBalances")
        if (stored !== null) {
            setHideBalances(JSON.parse(stored))
        }
    }, [])

    // Save to localStorage when changed
    const handleSetHideBalances = (value: boolean) => {
        setHideBalances(value)
        localStorage.setItem("hideBalances", JSON.stringify(value))
    }

    return (
        <SecurityContext.Provider value={{ hideBalances, setHideBalances: handleSetHideBalances }}>
            {children}
        </SecurityContext.Provider>
    )
}

export function useSecuritySettings() {
    const context = useContext(SecurityContext)
    if (context === undefined) {
        throw new Error("useSecuritySettings must be used within a SecurityProvider")
    }
    return context
}

// Helper function to mask amounts
export function maskAmount(amount: number | string, hide: boolean): string {
    if (hide) {
        return "••••••"
    }
    if (typeof amount === "number") {
        return amount.toLocaleString("en-IN")
    }
    return amount
}
