"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { getMeApi } from "@/lib/auth/api"

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    </div>
  )
}
