"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function usePendingRequests() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchPendingCount = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      console.log("[v0] Fetching pending count, user:", user?.id)

      if (error || !user) {
        console.log("[v0] No user or error:", error)
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      console.log("[v0] User profile role:", profile?.role)

      // Only system admins see pending requests
      if (profile?.role !== "system_admin") {
        setIsLoading(false)
        return
      }

      const { count } = await supabase
        .from("facility_update_requests")
        .select("*", { count: "exact", head: true })
        .eq("request_status", "pending")

      console.log("[v0] Pending requests count:", count)

      setPendingCount(count || 0)
      setIsLoading(false)
    }

    fetchPendingCount()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("pending-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "facility_update_requests",
          filter: "request_status=eq.pending",
        },
        () => {
          console.log("[v0] Real-time update detected, refetching pending count")
          fetchPendingCount()
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return { pendingCount, isLoading }
}
