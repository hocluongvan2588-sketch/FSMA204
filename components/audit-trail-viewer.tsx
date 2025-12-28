"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { FileText, User, Clock, Search, Filter, Download, Eye, Edit, Trash2, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CorrectionHistoryModal } from "./correction-history-modal"

interface AuditEntry {
  id: string
  table_name: string
  record_id: string
  action: "INSERT" | "UPDATE" | "DELETE"
  user_id: string
  user_name: string
  user_email: string
  changes: Record<string, any>
  timestamp: string
}

export function AuditTrailViewer() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState<string>("all")

  useEffect(() => {
    loadAuditTrail()
  }, [])

  const loadAuditTrail = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("system_logs")
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error

      // Transform to audit format
      const transformedData = (data || []).map((log) => ({
        id: log.id,
        table_name: log.event_type || "unknown",
        record_id: log.related_id || "",
        action: log.action_type || "UPDATE",
        user_id: log.user_id,
        user_name: log.profiles?.full_name || "Unknown",
        user_email: log.profiles?.email || "",
        changes: log.details || {},
        timestamp: log.created_at,
      }))

      setAuditEntries(transformedData)
    } catch (err) {
      console.error("[v0] Audit trail load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "INSERT":
        return <Plus className="h-4 w-4 text-green-600" />
      case "UPDATE":
        return <Edit className="h-4 w-4 text-blue-600" />
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "INSERT":
        return <Badge className="bg-green-600 text-white">Created</Badge>
      case "UPDATE":
        return <Badge className="bg-blue-600 text-white">Updated</Badge>
      case "DELETE":
        return <Badge variant="destructive">Deleted</Badge>
      default:
        return <Badge>View</Badge>
    }
  }

  const filteredEntries = auditEntries.filter((entry) => {
    const matchesSearch =
      entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.record_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterAction === "all" || entry.action === filterAction

    return matchesSearch && matchesFilter
  })

  const exportAuditLog = () => {
    const csv = [
      ["Timestamp", "Action", "Table", "Record ID", "User", "Email"],
      ...filteredEntries.map((entry) => [
        new Date(entry.timestamp).toISOString(),
        entry.action,
        entry.table_name,
        entry.record_id,
        entry.user_name,
        entry.user_email,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              System Audit Trail
            </CardTitle>
            <CardDescription>Complete activity log for FDA compliance (21 CFR Part 11)</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <CorrectionHistoryModal />
            <Button variant="outline" size="sm" onClick={exportAuditLog}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, table, or record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Actions</option>
              <option value="INSERT">Created</option>
              <option value="UPDATE">Updated</option>
              <option value="DELETE">Deleted</option>
            </select>
          </div>
        </div>

        {/* Audit Log */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getActionIcon(entry.action)}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {getActionBadge(entry.action)}
                        <Badge variant="outline" className="font-mono text-xs">
                          {entry.table_name}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Record ID:</span>{" "}
                        <span className="font-mono text-muted-foreground">{entry.record_id}</span>
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{entry.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredEntries.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No audit entries found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
