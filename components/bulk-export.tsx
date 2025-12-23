"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { convertToCSV, downloadCSV } from "@/lib/utils/csv-parser"

interface BulkExportProps<T> {
  title: string
  description: string
  columns: Array<{ key: string; label: string; selected?: boolean }>
  onFetch: (selectedColumns: string[]) => Promise<T[]>
  filename?: string
}

export function BulkExport<T extends Record<string, any>>({
  title,
  description,
  columns: initialColumns,
  onFetch,
  filename = "export.csv",
}: BulkExportProps<T>) {
  const [columns, setColumns] = useState(initialColumns.map((col) => ({ ...col, selected: col.selected !== false })))
  const [isExporting, setIsExporting] = useState(false)

  const toggleColumn = (key: string) => {
    setColumns((prev) => prev.map((col) => (col.key === key ? { ...col, selected: !col.selected } : col)))
  }

  const selectAll = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, selected: true })))
  }

  const deselectAll = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, selected: false })))
  }

  const handleExport = async () => {
    const selectedColumns = columns.filter((col) => col.selected).map((col) => col.key)
    if (selectedColumns.length === 0) {
      alert("Please select at least one column to export")
      return
    }

    setIsExporting(true)
    try {
      const data = await onFetch(selectedColumns)
      const csvContent = convertToCSV(data, selectedColumns)
      downloadCSV(csvContent, filename)
    } catch (error) {
      console.error("[v0] Error exporting data:", error)
      alert("Error exporting data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Select Columns to Export</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 max-h-64 overflow-y-auto">
            {columns.map((col) => (
              <div key={col.key} className="flex items-center space-x-2">
                <Checkbox id={col.key} checked={col.selected} onCheckedChange={() => toggleColumn(col.key)} />
                <Label htmlFor={col.key} className="text-sm font-normal cursor-pointer">
                  {col.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || columns.filter((col) => col.selected).length === 0}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export to CSV ({columns.filter((col) => col.selected).length} columns)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
