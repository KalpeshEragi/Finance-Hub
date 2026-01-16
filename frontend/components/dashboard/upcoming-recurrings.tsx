"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

const recurrings = [
  { name: "Netflix", date: "Jan 15", amount: "₹649" },
  { name: "Spotify", date: "Jan 18", amount: "₹119" },
  { name: "Gym Membership", date: "Jan 20", amount: "₹2,500" },
  { name: "Internet Bill", date: "Jan 22", amount: "₹1,199" },
]

export function UpcomingRecurrings() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Next two weeks</CardTitle>
        <button className="flex items-center text-xs text-primary hover:underline">
          Recurrings <ChevronRight className="w-3 h-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recurrings.map((item) => (
            <div key={item.name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                  <span className="text-xs">📅</span>
                </div>
                <div>
                  <p className="text-sm text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">{item.amount}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
