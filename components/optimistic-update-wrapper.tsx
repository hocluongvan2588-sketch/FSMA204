"use client"

import type React from "react"

import { useOptimistic, useTransition } from "react"

interface OptimisticUpdateWrapperProps<T> {
  data: T
  onUpdate: (newData: T) => Promise<void>
  children: (data: T, updateFn: (newData: T) => void, isPending: boolean) => React.ReactNode
}

export function OptimisticUpdateWrapper<T>({ data, onUpdate, children }: OptimisticUpdateWrapperProps<T>) {
  const [optimisticData, setOptimisticData] = useOptimistic(data)
  const [isPending, startTransition] = useTransition()

  const updateData = (newData: T) => {
    startTransition(async () => {
      setOptimisticData(newData)
      try {
        await onUpdate(newData)
      } catch (error) {
        console.error("[v0] Optimistic update failed:", error)
      }
    })
  }

  return <>{children(optimisticData, updateData, isPending)}</>
}
