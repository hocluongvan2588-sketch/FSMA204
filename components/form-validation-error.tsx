import { AlertCircle } from "lucide-react"

interface FormValidationErrorProps {
  errors: Record<string, string>
}

export function FormValidationError({ errors }: FormValidationErrorProps) {
  const errorCount = Object.keys(errors).length

  if (errorCount === 0) return null

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-900 mb-2">Có {errorCount} lỗi cần khắc phục</h4>
          <ul className="space-y-1 text-sm text-red-700">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <span className="font-medium">{field}:</span> {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
