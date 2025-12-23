"use client"

import { Component, type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[v0] Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-slate-600 mb-4 text-center max-w-md">
              {this.state.error?.message || "Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."}
            </p>
            <Button onClick={() => this.setState({ hasError: false })} variant="outline">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
