"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { toast } from "sonner"

interface NotificationContextType {
    notificationsEnabled: boolean
    setNotificationsEnabled: (enabled: boolean) => void
    triggerNotification: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// 5 unique payment reminder messages
const PAYMENT_REMINDERS = [
    { icon: "💳", title: "Credit Card Payment Due", message: "Payment of ₹15,000 due in 3 days" },
    { icon: "🏠", title: "Rent Payment Reminder", message: "Monthly rent due on 1st - ₹25,000" },
    { icon: "📱", title: "Mobile Bill Payment", message: "Airtel bill approaching - ₹499" },
    { icon: "⚡", title: "Electricity Bill Due", message: "MSEB bill due soon - ₹2,340" },
    { icon: "🎬", title: "Subscription Renewal", message: "Netflix renewing tomorrow - ₹649" },
]

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false)
    const [reminderIndex, setReminderIndex] = useState(0)

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("notificationsEnabled")
        if (stored !== null) {
            setNotificationsEnabled(JSON.parse(stored))
        }
    }, [])

    // Persist to localStorage
    const handleSetNotificationsEnabled = (enabled: boolean) => {
        setNotificationsEnabled(enabled)
        localStorage.setItem("notificationsEnabled", JSON.stringify(enabled))
    }

    // Trigger a notification with cycling messages
    const triggerNotification = useCallback(() => {
        if (!notificationsEnabled) return

        const reminder = PAYMENT_REMINDERS[reminderIndex]

        toast(reminder.title, {
            description: reminder.message,
            icon: reminder.icon,
            position: "bottom-right",
            duration: 5000,
        })

        // Cycle to next reminder
        setReminderIndex((prev) => (prev + 1) % PAYMENT_REMINDERS.length)
    }, [notificationsEnabled, reminderIndex])

    return (
        <NotificationContext.Provider
            value={{
                notificationsEnabled,
                setNotificationsEnabled: handleSetNotificationsEnabled,
                triggerNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider")
    }
    return context
}
