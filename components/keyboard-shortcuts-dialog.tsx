"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard } from "lucide-react"
import { GLOBAL_SHORTCUTS } from "@/lib/utils/keyboard-shortcuts"

export function KeyboardShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          Phím tắt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phím tắt</DialogTitle>
          <DialogDescription>Các phím tắt để sử dụng hệ thống nhanh hơn</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {GLOBAL_SHORTCUTS.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.ctrlKey && (
                  <kbd className="px-2 py-1 text-xs font-semibold bg-slate-100 border border-slate-300 rounded">
                    Ctrl
                  </kbd>
                )}
                {shortcut.shiftKey && (
                  <kbd className="px-2 py-1 text-xs font-semibold bg-slate-100 border border-slate-300 rounded">
                    Shift
                  </kbd>
                )}
                {shortcut.altKey && (
                  <kbd className="px-2 py-1 text-xs font-semibold bg-slate-100 border border-slate-300 rounded">
                    Alt
                  </kbd>
                )}
                <kbd className="px-2 py-1 text-xs font-semibold bg-slate-100 border border-slate-300 rounded uppercase">
                  {shortcut.key}
                </kbd>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
