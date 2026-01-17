"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Palette,
    Globe,
    Moon,
    Sun,
    Laptop
} from "lucide-react"
import { useSettings, type Theme, type Language, type Currency } from "@/lib/context/settings-context"

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const { theme, setTheme, language, setLanguage, currency, setCurrency } = useSettings()

    const handleSave = () => {
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">App Settings</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage display and regional preferences</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Navigation Sidebar */}
                <div className="md:col-span-1 space-y-4">
                    <Card className="bg-card border-border">
                        <CardContent className="p-3">
                            <nav className="space-y-1">
                                <Button variant="ghost" className="w-full justify-start gap-3 bg-secondary/50">
                                    <Palette className="w-4 h-4" />
                                    Appearance
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-3">
                                    <Globe className="w-4 h-4" />
                                    Language & Region
                                </Button>
                            </nav>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="md:col-span-2 space-y-6">

                    {/* Appearance */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-primary" />
                                <CardTitle>Appearance</CardTitle>
                            </div>
                            <CardDescription>Customize how FinanceHub looks on your device</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label>Theme Preference</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${theme === "light" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                                    >
                                        <div className="w-full aspect-video rounded bg-[#f0f0f0] border border-gray-200 flex items-center justify-center">
                                            <Sun className="w-6 h-6 text-gray-900" />
                                        </div>
                                        <span className="text-xs font-medium">Light</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                                    >
                                        <div className="w-full aspect-video rounded bg-[#1a1a1a] border border-gray-800 flex items-center justify-center">
                                            <Moon className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-xs font-medium">Dark</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme("system")}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${theme === "system" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                                    >
                                        <div className="w-full aspect-video rounded bg-gradient-to-r from-[#f0f0f0] to-[#1a1a1a] border border-gray-200 flex items-center justify-center">
                                            <Laptop className="w-6 h-6 text-gray-500 mix-blend-difference" />
                                        </div>
                                        <span className="text-xs font-medium">System</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                <div className="space-y-0.5">
                                    <Label>Reduced Motion</Label>
                                    <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Regional */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary" />
                                <CardTitle>Language & Region</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>App Language</Label>
                                <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English (US)</SelectItem>
                                        <SelectItem value="en-in">English (India)</SelectItem>
                                        <SelectItem value="hi">Hindi</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Currency Format</Label>
                                <Select value={currency} onValueChange={(val) => setCurrency(val as Currency)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                                        <SelectItem value="usd">US Dollar ($)</SelectItem>
                                        <SelectItem value="eur">Euro (€)</SelectItem>
                                        <SelectItem value="gbp">British Pound (£)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
