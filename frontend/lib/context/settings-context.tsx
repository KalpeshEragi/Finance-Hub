"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type Theme = "light" | "dark" | "system"
export type Language = "en" | "en-in" | "hi" | "es"
export type Currency = "inr" | "usd" | "eur" | "gbp"

interface SettingsContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    language: Language
    setLanguage: (lang: Language) => void
    currency: Currency
    setCurrency: (curr: Currency) => void
    formatCurrency: (amount: number) => string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark")
    const [language, setLanguage] = useState<Language>("en")
    const [currency, setCurrency] = useState<Currency>("inr")

    // Load settings from localStorage
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") as Theme
        const storedLang = localStorage.getItem("language") as Language
        const storedCurr = localStorage.getItem("currency") as Currency

        if (storedTheme) setTheme(storedTheme)
        if (storedLang) setLanguage(storedLang)
        if (storedCurr) setCurrency(storedCurr)
    }, [])

    // Apply theme changes
    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }

        localStorage.setItem("theme", theme)
    }, [theme])

    // Save other settings
    useEffect(() => { localStorage.setItem("language", language) }, [language])
    useEffect(() => { localStorage.setItem("currency", currency) }, [currency])

    const formatCurrency = (amount: number) => {
        const config: Record<Currency, { locale: string, currency: string }> = {
            inr: { locale: "en-IN", currency: "INR" },
            usd: { locale: "en-US", currency: "USD" },
            eur: { locale: "de-DE", currency: "EUR" },
            gbp: { locale: "en-GB", currency: "GBP" },
        }

        const { locale, currency: currCode } = config[currency] || config.inr

        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currCode,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <SettingsContext.Provider
            value={{
                theme, setTheme,
                language, setLanguage,
                currency, setCurrency,
                formatCurrency
            }}
        >
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
