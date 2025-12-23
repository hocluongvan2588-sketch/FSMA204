"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { parseCSV } from "@/lib/utils/csv-parser"

interface BulkUploadProps<T> {
  title: string
  description: string
  templateColumns: string[]
  onValidate: (data: any[]) => Promise<{
    valid: T[]
    errors: Array<{ row: number; field: string; message: string }>
  }>
  onUpload: (data: T[]) => Promise<void>
  maxFileSize?: number // in MB
}

export function BulkUpload<T>({
  title,
  description,
  templateColumns,
  onValidate,
  onUpload,
  maxFileSize = 5,
}: BulkUploadProps<T>) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [validData, setValidData] = useState<T[]>([])
  const [errors, setErrors] = useState<Array<{ row: number; field: string; message: string }>>([])
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > maxFileSize * 1024 * 1024) {
        alert(`File size must be less than ${maxFileSize}MB`)
        return
      }
      setFile(selectedFile)
      setErrors([])
      setValidData([])
      setUploadComplete(false)
    }
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(10)

    try {
      // Read file
      const text = await file.text()
      setProgress(30)

      // Parse CSV
      const parsedData = parseCSV(text)
      setProgress(50)

      // Validate
      const result = await onValidate(parsedData)
      setProgress(70)

      setValidData(result.valid)
      setErrors(result.errors)
      setProgress(100)
    } catch (error) {
      console.error("[v0] Error processing file:", error)
      setErrors([{ row: 0, field: "file", message: "Error processing file. Please check format." }])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpload = async () => {
    if (validData.length === 0) return

    setIsProcessing(true)
    try {
      await onUpload(validData)
      setUploadComplete(true)
      setFile(null)
      setValidData([])
      setErrors([])
    } catch (error) {
      console.error("[v0] Error uploading data:", error)
      setErrors([{ row: 0, field: "upload", message: "Error uploading data. Please try again." }])
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = templateColumns.join(",")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "template.csv"
    link.click()
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
        {/* Template Download */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Download CSV Template</p>
            <p className="text-sm text-muted-foreground">Get the correct format for bulk upload</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label htmlFor="file-upload" className="block text-sm font-medium">
            Upload CSV File
          </label>
          <div className="flex gap-2">
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
            <Button onClick={handleProcess} disabled={!file || isProcessing}>
              <Upload className="mr-2 h-4 w-4" />
              Process
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Maximum file size: {maxFileSize}MB</p>
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">Processing... {progress}%</p>
          </div>
        )}

        {/* Results */}
        {!isProcessing && validData.length > 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  <strong>{validData.length}</strong> valid records ready to upload
                </span>
                <Button onClick={handleUpload} disabled={isProcessing}>
                  Upload All
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{errors.length} errors found:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {errors.slice(0, 10).map((error, i) => (
                    <div key={i} className="text-sm">
                      Row {error.row}: {error.field} - {error.message}
                    </div>
                  ))}
                  {errors.length > 10 && <p className="text-sm">... and {errors.length - 10} more errors</p>}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success */}
        {uploadComplete && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Data uploaded successfully!</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
