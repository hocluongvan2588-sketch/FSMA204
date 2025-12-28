"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileEdit, User, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CorrectionRecord {
  id: string
  cte_id: string
  corrected_by: string
  corrector_name: string
  correction_type: string
  field_changed: string
  old_value: string
  new_value: string
  correction_reason: string
  fda_regulation_reference: string
  correction_timestamp: string
  approved_by: string | null
  approval_status: "pending" | "approved" | "rejected"
}

interface CorrectionHistoryModalProps {
  cteId?: string
  triggerButton?: React.ReactNode
}

export function CorrectionHistoryModal({ cteId, triggerButton }: CorrectionHistoryModalProps) {
  const [corrections, setCorrections] = useState<CorrectionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadCorrections()
    }
  }, [open, cteId])

  const loadCorrections = async () => {
    try {
      const supabase = createClient()

      let query = supabase
        .from("cte_corrections_audit")
        .select(`
          *,
          profiles!corrected_by(full_name),
          profiles!approved_by(full_name)
        `)
        .order("correction_timestamp", { ascending: false })

      if (cteId) {
        query = query.eq("cte_id", cteId)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error

      // Transform data to include corrector name
      const transformedData = (data || []).map((item) => ({
        ...item,
        corrector_name: item.profiles?.full_name || "Unknown User",
      }))

      setCorrections(transformedData)
    } catch (err) {
      console.error("[v0] Corrections load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600 text-white">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>
    }
  }

  const getCorrectionTypeColor = (type: string) => {
    switch (type) {
      case "quantity_adjustment":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "date_correction":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "kde_update":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "location_change":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            <FileEdit className="h-4 w-4 mr-2" />
            Correction History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-primary" />
            CTE Correction History
          </DialogTitle>
          <DialogDescription>
            Audit trail of all corrections made to CTE records (FSMA 204 Section 204.6 - Records Requirements)
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : corrections.length === 0 ? (
          <div className="text-center py-12">
            <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No corrections recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              All corrections will be tracked here for FDA compliance
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {corrections.map((correction) => (
                <div
                  key={correction.id}
                  className="border rounded-lg p-4 space-y-3 bg-card hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getCorrectionTypeColor(correction.correction_type)}>
                        {correction.correction_type.replace(/_/g, " ")}
                      </Badge>
                      {getStatusBadge(correction.approval_status)}
                    </div>
                    {getStatusIcon(correction.approval_status)}
                  </div>

                  {/* Field Changed */}
                  <div className="bg-muted/50 rounded p-3 space-y-2">
                    <p className="text-sm font-medium">Field: {correction.field_changed}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Old Value:</p>
                        <p className="font-mono bg-red-50 border border-red-200 rounded px-2 py-1 text-red-700">
                          {correction.old_value}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">New Value:</p>
                        <p className="font-mono bg-green-50 border border-green-200 rounded px-2 py-1 text-green-700">
                          {correction.new_value}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Correction Reason:</p>
                    <p className="text-sm text-muted-foreground">{correction.correction_reason}</p>
                  </div>

                  {/* FDA Reference */}
                  {correction.fda_regulation_reference && (
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded p-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-900">FDA Regulation:</p>
                        <p className="text-xs text-blue-700">{correction.fda_regulation_reference}</p>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{correction.corrector_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(correction.correction_timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {correction.approved_by && <span>Approved by: {correction.approved_by}</span>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex items-center gap-2 pt-4 border-t text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <p>This audit trail meets FDA requirements for electronic records (21 CFR Part 11)</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
