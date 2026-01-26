"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { getMeApi } from "@/lib/auth/api"
import { Toaster } from "@/components/ui/sonner"
import { NotificationProvider, useNotifications } from "@/lib/context/notification-context"

// Cookie utility
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

// Component that triggers notifications
function NotificationTrigger() {
  const { notificationsEnabled, triggerNotification } = useNotifications()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (notificationsEnabled) {
      // Trigger first notification after 10 seconds
      const timeout = setTimeout(() => {
        triggerNotification()

        // Then trigger every 30 seconds
        intervalRef.current = setInterval(() => {
          triggerNotification()
        }, 30000)
      }, 10000)

      return () => {
        clearTimeout(timeout)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [notificationsEnabled, triggerNotification])

  return null
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfo] = useState<{
    email?: string;
    fullName?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = getCookie('auth_token');

      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await getMeApi(token);
        setUserInfo({
          email: response.data.email,
          fullName: response.data.name,
        });
      } catch {
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={userInfo} />
      <main className="flex-1 p-6">{children}</main>
      <NotificationTrigger />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationProvider>
      <DashboardContent>{children}</DashboardContent>
      <Toaster position="bottom-right" richColors />
    </NotificationProvider>
  )
}
