"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const renewalDates: Record<number, { name: string; amount: number; icon: string }[]> = {
  17: [{ name: "iCloud", amount: 75, icon: "☁️" }],
  18: [{ name: "Netflix", amount: 649, icon: "🎬" }],
  19: [{ name: "Electricity", amount: 1800, icon: "⚡" }],
  20: [{ name: "Gym", amount: 2500, icon: "💪" }],
  22: [{ name: "Spotify", amount: 119, icon: "🎵" }],
  25: [{ name: "Jio Fiber", amount: 1199, icon: "📶" }],
  28: [{ name: "Disney+", amount: 299, icon: "✨" }],
  30: [{ name: "Swiggy One", amount: 149, icon: "🍔" }],
}

export function CalendarView() {
  const [currentMonth] = useState(new Date(2026, 0, 16)) // January 2026

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const today = 16 // Current day

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => null)
  const allDays = [...paddingDays, ...days]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground">January 2026</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {allDays.map((day, index) => {
            const hasRenewal = day && renewalDates[day]
            const isToday = day === today
            const isPast = day && day < today

            return (
              <div
                key={index}
                className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-center relative ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : hasRenewal
                      ? "bg-amber-500/20 hover:bg-amber-500/30 cursor-pointer"
                      : isPast
                        ? "text-muted-foreground/50"
                        : "hover:bg-secondary"
                } transition-colors`}
              >
                {day && (
                  <>
                    <span className={`text-sm ${isToday ? "font-bold" : ""}`}>{day}</span>
                    {hasRenewal && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {renewalDates[day].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-primary-foreground" : "bg-amber-500"}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Upcoming this week */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">This week</p>
          <div className="space-y-2">
            {Object.entries(renewalDates)
              .filter(([day]) => Number.parseInt(day) >= today && Number.parseInt(day) <= today + 7)
              .slice(0, 3)
              .map(([day, items]) =>
                items.map((item) => (
                  <div key={`${day}-${item.name}`} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-foreground">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">Jan {day}</span>
                  </div>
                )),
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
