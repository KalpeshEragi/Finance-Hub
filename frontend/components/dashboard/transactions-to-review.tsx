"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

const transactions = [
  {
    id: 1,
    name: "Netflix",
    category: "SUBSCRIPTION",
    categoryColor: "bg-blue-500",
    amount: "₹649",
    date: "TODAY",
  },
  {
    id: 2,
    name: "Big Bazaar",
    category: "GROCERIES",
    categoryColor: "bg-emerald-500",
    amount: "₹2,340",
    date: "TODAY",
  },
  {
    id: 3,
    name: "Uber",
    category: "TRANSPORTATION",
    categoryColor: "bg-orange-500",
    amount: "₹450",
    date: "TODAY",
  },
  {
    id: 4,
    name: "PVR Cinemas",
    category: "ENTERTAINMENT",
    categoryColor: "bg-pink-500",
    amount: "₹890",
    date: "YESTERDAY",
  },
  {
    id: 5,
    name: "Swiggy",
    category: "RESTAURANTS",
    categoryColor: "bg-red-500",
    amount: "₹520",
    date: "YESTERDAY",
  },
  {
    id: 6,
    name: "Amazon",
    category: "SHOPPING",
    categoryColor: "bg-yellow-500",
    amount: "₹3,499",
    date: "YESTERDAY",
  },
]

export function TransactionsToReview() {
  let currentDate = ""

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Transactions to review</CardTitle>
        <button className="flex items-center text-xs text-primary hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </CardHeader>
      <CardContent className="space-y-1">
        {transactions.map((tx) => {
          const showDate = tx.date !== currentDate
          currentDate = tx.date

          return (
            <div key={tx.id}>
              {showDate && <p className="text-xs text-muted-foreground uppercase tracking-wider py-2">{tx.date}</p>}
              <div className="flex items-center justify-between py-2 hover:bg-secondary/50 rounded-lg px-2 -mx-2 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                    <span className="text-xs">🏷️</span>
                  </div>
                  <span className="text-sm text-foreground">{tx.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${tx.categoryColor} text-white`}>{tx.category}</span>
                  <span className="text-sm font-medium text-foreground">{tx.amount}</span>
                </div>
              </div>
            </div>
          )
        })}
        <button className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2">
          Mark 6 as reviewed
        </button>
      </CardContent>
    </Card>
  )
}
