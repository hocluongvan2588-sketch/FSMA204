"use client"

import { useEffect } from "react"

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === (e.ctrlKey || e.metaKey)
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === e.altKey

        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.handler()
          break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts])
}

export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: "k",
    ctrlKey: true,
    handler: () => {
      document.querySelector<HTMLButtonElement>("[data-search-trigger]")?.click()
    },
    description: "Mở tìm kiếm",
  },
  {
    key: "n",
    ctrlKey: true,
    handler: () => {
      window.location.href = "/dashboard/lots/create"
    },
    description: "Tạo lô mới",
  },
  {
    key: "h",
    ctrlKey: true,
    handler: () => {
      window.location.href = "/dashboard"
    },
    description: "Về trang chủ",
  },
]
