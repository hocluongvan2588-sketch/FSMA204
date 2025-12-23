"use client"

import { toast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"

export const showSuccessToast = (message: string, description?: string) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span>{message}</span>
      </div>
    ),
    description,
    variant: "default",
  })
}

export const showErrorToast = (message: string, description?: string) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-red-600" />
        <span>{message}</span>
      </div>
    ),
    description,
    variant: "destructive",
  })
}

export const showWarningToast = (message: string, description?: string) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <span>{message}</span>
      </div>
    ),
    description,
    variant: "default",
  })
}

export const showInfoToast = (message: string, description?: string) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-600" />
        <span>{message}</span>
      </div>
    ),
    description,
    variant: "default",
  })
}
