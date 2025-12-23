"use client"

import type React from "react"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Bot, User, Loader2 } from "lucide-react"

interface FSMAChatbotProps {
  onClose: () => void
  userName?: string
  isEmbedded?: boolean
}

export function FSMAChatbot({ onClose, userName, isEmbedded = false }: FSMAChatbotProps) {
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat-fsma" }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== "ready") return
    sendMessage({ text: input })
    setInput("")
  }

  const quickQuestions = ["FSMA 204 là gì?", "CTE và KDE là gì?", "Cách tạo TLC code?", "Hạn chót tuân thủ khi nào?"]

  const ChatContent = (
    <>
      {!isEmbedded && (
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Trợ lý Vexim Global</CardTitle>
                <p className="text-sm text-emerald-50">Luôn sẵn sàng hỗ trợ bạn</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-white/20 text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
      )}

      {/* Chat Messages */}
      <CardContent className="flex-1 p-6 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 bg-emerald-50 rounded-2xl rounded-tl-none p-4">
                    <p className="text-sm text-foreground">
                      Xin chào {userName ? <span className="font-semibold">{userName}</span> : "bạn"}! 👋
                    </p>
                    <p className="text-sm text-foreground mt-2">
                      Tôi là trợ lý AI chuyên về FSMA 204. Tôi có thể giúp bạn:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Hiểu các quy định FSMA 204</li>
                      <li>Hướng dẫn sử dụng nền tảng</li>
                      <li>Trả lời câu hỏi về CTE, KDE, TLC</li>
                      <li>Tư vấn tuân thủ pháp lý</li>
                    </ul>
                  </div>
                </div>

                {/* Quick Questions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground px-2">Câu hỏi gợi ý:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(question)
                          sendMessage({ text: question })
                        }}
                        className="rounded-xl text-xs h-auto py-2 px-3 hover:bg-emerald-50 hover:border-emerald-300 text-left justify-start"
                        disabled={status !== "ready"}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}

                <div
                  className={`flex-1 max-w-[80%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-emerald-500 text-white rounded-tr-none ml-auto"
                      : "bg-slate-100 text-foreground rounded-tl-none"
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <p key={index} className="text-sm whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </p>
                      )
                    }
                    return null
                  })}
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {status === "streaming" && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4">
                  <div className="flex gap-1">
                    <div
                      className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            disabled={status !== "ready"}
            className="flex-1 rounded-xl"
          />
          <Button
            type="submit"
            disabled={!input.trim() || status !== "ready"}
            className="rounded-xl px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            {status === "streaming" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </CardContent>
    </>
  )

  if (isEmbedded) {
    return <div className="h-full flex flex-col">{ChatContent}</div>
  }

  return (
    <Card className="rounded-3xl shadow-2xl border-2 border-emerald-200 overflow-hidden h-[600px] flex flex-col">
      {ChatContent}
    </Card>
  )
}
