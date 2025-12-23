"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, MessageCircle, BookOpen, AlertCircle, Scale, Wrench } from "lucide-react"
import Link from "next/link"
import type { EducationContent, NotificationType } from "@/types/education-hub"
import { FSMAChatbot } from "./fsma-chatbot"

interface EducationHubProps {
  content: EducationContent | null
  userName?: string
}

const typeConfig: Record<
  NotificationType,
  {
    icon: any
    bgColor: string
    iconColor: string
    borderColor: string
  }
> = {
  education: {
    icon: BookOpen,
    bgColor: "from-emerald-50 to-emerald-100",
    iconColor: "from-emerald-500 to-emerald-600",
    borderColor: "border-emerald-200",
  },
  maintenance: {
    icon: Wrench,
    bgColor: "from-rose-50 to-rose-100",
    iconColor: "from-rose-500 to-rose-600",
    borderColor: "border-rose-200",
  },
  legal: {
    icon: Scale,
    bgColor: "from-amber-50 to-amber-100",
    iconColor: "from-amber-500 to-amber-600",
    borderColor: "border-amber-200",
  },
  technical: {
    icon: AlertCircle,
    bgColor: "from-blue-50 to-blue-100",
    iconColor: "from-blue-500 to-blue-600",
    borderColor: "border-blue-200",
  },
}

export function EducationHub({ content, userName }: EducationHubProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [showChat, setShowChat] = useState(false)

  if (isDismissed || !content) {
    return null
  }

  const config = typeConfig[content.type]
  const Icon = config.icon

  if (showChat) {
    return <FSMAChatbot onClose={() => setShowChat(false)} userName={userName} />
  }

  return (
    <Card
      className={`rounded-3xl shadow-lg border-2 ${config.borderColor} overflow-hidden hover:shadow-xl transition-all duration-300`}
    >
      <div className={`bg-gradient-to-br ${config.bgColor} dark:from-slate-800 dark:to-slate-900`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br ${config.iconColor} shadow-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
                  {content.tag}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDismissed(true)}
                  className="h-6 w-6 p-0 hover:bg-black/5"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">{content.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{content.content}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button asChild size="sm" className="rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <Link href={content.link}>{content.cta_label}</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChat(true)}
                  className="rounded-xl gap-2 hover:bg-background/50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat với AI
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
