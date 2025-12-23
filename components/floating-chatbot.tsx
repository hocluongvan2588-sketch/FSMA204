"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import { FSMAChatbot } from "./fsma-chatbot"

interface FloatingChatbotProps {
  userName?: string
}

export function FloatingChatbot({ userName }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          data-tour="ai-chatbot"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-emerald-500/50 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/70 z-50 transition-all hover:scale-110 animate-pulse"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl rounded-3xl overflow-hidden z-50 border border-slate-200 dark:border-slate-800 bg-background">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Trợ lý Vexim Global</h3>
                  <p className="text-white/80 text-xs">Luôn sẵn sàng hỗ trợ bạn</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-white/20 text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat content */}
            <div className="flex-1 overflow-hidden">
              <FSMAChatbot onClose={() => setIsOpen(false)} userName={userName} isEmbedded />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
