"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff } from "lucide-react"
import { useNotifications } from "@/lib/context/notification-context"

export default function NotificationsPage() {
    const { notificationsEnabled, setNotificationsEnabled } = useNotifications()

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your notification preferences
                </p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        {notificationsEnabled ? (
                            <Bell className="w-5 h-5 text-primary" />
                        ) : (
                            <BellOff className="w-5 h-5 text-muted-foreground" />
                        )}
                        Payment Reminders
                    </CardTitle>
                    <CardDescription>
                        Get notified when payments are approaching their due dates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full ${notificationsEnabled ? 'bg-primary/20' : 'bg-muted'} flex items-center justify-center`}>
                                {notificationsEnabled ? (
                                    <Bell className="w-6 h-6 text-primary" />
                                ) : (
                                    <BellOff className="w-6 h-6 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="notifications" className="text-base font-medium text-foreground">
                                        Enable Notifications
                                    </Label>
                                    <Badge
                                        variant={notificationsEnabled ? "default" : "secondary"}
                                        className={notificationsEnabled ? "bg-green-500/20 text-green-500 border-0" : ""}
                                    >
                                        {notificationsEnabled ? "ON" : "OFF"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {notificationsEnabled
                                        ? "You will receive payment reminder notifications"
                                        : "Notifications are currently disabled"}
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="notifications"
                            checked={notificationsEnabled}
                            onCheckedChange={setNotificationsEnabled}
                        />
                    </div>

                    {notificationsEnabled && (
                        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Active reminders:</span> Credit cards, rent, bills, and subscriptions
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
