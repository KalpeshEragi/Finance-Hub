"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Car, Home, Plane, Smartphone, GraduationCap, Gift, Gem, Laptop, Dumbbell, Camera } from "lucide-react"

const goalIcons = [
  { icon: Car, label: "Car", emoji: "🚗" },
  { icon: Home, label: "Home", emoji: "🏠" },
  { icon: Plane, label: "Travel", emoji: "✈️" },
  { icon: Smartphone, label: "Phone", emoji: "📱" },
  { icon: GraduationCap, label: "Education", emoji: "🎓" },
  { icon: Gift, label: "Gift", emoji: "🎁" },
  { icon: Gem, label: "Jewelry", emoji: "💎" },
  { icon: Laptop, label: "Electronics", emoji: "💻" },
  { icon: Dumbbell, label: "Fitness", emoji: "🏋️" },
  { icon: Camera, label: "Camera", emoji: "📷" },
]

const goalColors = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

interface AddGoalDialogProps {
  onAddGoal: (goal: {
    name: string
    targetAmount: number
    duration: number
    durationType: "months" | "years"
    icon: string
    color: string
    category: string
  }) => void
}

export function AddGoalDialog({ onAddGoal }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [duration, setDuration] = useState("")
  const [durationType, setDurationType] = useState<"months" | "years">("months")
  const [selectedIcon, setSelectedIcon] = useState(goalIcons[0])
  const [selectedColor, setSelectedColor] = useState(goalColors[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !targetAmount || !duration) return

    onAddGoal({
      name,
      targetAmount: Number.parseFloat(targetAmount),
      duration: Number.parseInt(duration),
      durationType,
      icon: selectedIcon.emoji,
      color: selectedColor,
      category: selectedIcon.label,
    })

    // Reset form
    setName("")
    setTargetAmount("")
    setDuration("")
    setDurationType("months")
    setSelectedIcon(goalIcons[0])
    setSelectedColor(goalColors[0])
    setOpen(false)
  }

  const monthlySavingRequired =
    targetAmount && duration
      ? Number.parseFloat(targetAmount) /
        (durationType === "years" ? Number.parseInt(duration) * 12 : Number.parseInt(duration))
      : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create a New Savings Goal</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set a target for something you want to buy and track your progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              What do you want to save for?
            </Label>
            <Input
              id="name"
              placeholder="e.g., iPhone 16 Pro, Europe Trip, New Car..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Target Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 150000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-foreground">Target Duration</Label>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="e.g., 12"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-secondary border-border text-foreground flex-1"
              />
              <Select value={durationType} onValueChange={(v) => setDurationType(v as "months" | "years")}>
                <SelectTrigger className="w-32 bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label className="text-foreground">Choose an Icon</Label>
            <div className="flex flex-wrap gap-2">
              {goalIcons.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSelectedIcon(item)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                    selectedIcon.label === item.label
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-foreground">Choose a Color</Label>
            <div className="flex flex-wrap gap-2">
              {goalColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Monthly Saving Preview */}
          {monthlySavingRequired > 0 && (
            <div className="bg-secondary/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">To reach your goal, save approximately:</p>
              <p className="text-2xl font-semibold text-primary">
                ₹{Math.ceil(monthlySavingRequired).toLocaleString("en-IN")}
                <span className="text-sm text-muted-foreground font-normal">/month</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-border text-foreground bg-transparent"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!name || !targetAmount || !duration}
            >
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
