"use client"

import { useState } from "react"
import { X, Plus, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { validateSourceTLC, type TLCValidationResult } from "@/lib/utils/fsma-204-validation"

interface TransformationInputSelectorProps {
  onInputsChange: (inputs: Array<{ tlc_id: string; tlc_code: string; quantity_used: number }>) => void
  disabled?: boolean
}

export function TransformationInputSelector({ onInputsChange, disabled }: TransformationInputSelectorProps) {
  const [inputs, setInputs] = useState<
    Array<{
      id: string
      tlc_code: string
      quantity_used: number
      validation: TLCValidationResult | null
      isValidating: boolean
    }>
  >([{ id: crypto.randomUUID(), tlc_code: "", quantity_used: 0, validation: null, isValidating: false }])

  const validateTLC = async (index: number, tlcCode: string) => {
    if (!tlcCode.trim()) {
      const newInputs = [...inputs]
      newInputs[index].validation = null
      setInputs(newInputs)
      return
    }

    // Set validating state
    const newInputs = [...inputs]
    newInputs[index].isValidating = true
    setInputs(newInputs)

    // Validate
    const result = await validateSourceTLC(tlcCode)

    // Update validation result
    const updatedInputs = [...inputs]
    updatedInputs[index].validation = result
    updatedInputs[index].isValidating = false
    setInputs(updatedInputs)

    // Notify parent of valid inputs
    notifyParent(updatedInputs)
  }

  const notifyParent = (currentInputs: typeof inputs) => {
    const validInputs = currentInputs
      .filter((input) => input.validation?.valid && input.quantity_used > 0)
      .map((input) => ({
        tlc_id: input.validation!.tlc!.id,
        tlc_code: input.tlc_code,
        quantity_used: input.quantity_used,
      }))

    onInputsChange(validInputs)
  }

  const handleTLCChange = (index: number, value: string) => {
    const newInputs = [...inputs]
    newInputs[index].tlc_code = value
    setInputs(newInputs)
  }

  const handleTLCBlur = (index: number) => {
    const tlcCode = inputs[index].tlc_code
    validateTLC(index, tlcCode)
  }

  const handleQuantityChange = (index: number, value: number) => {
    const newInputs = [...inputs]
    newInputs[index].quantity_used = value
    setInputs(newInputs)
    notifyParent(newInputs)
  }

  const addInput = () => {
    setInputs([
      ...inputs,
      { id: crypto.randomUUID(), tlc_code: "", quantity_used: 0, validation: null, isValidating: false },
    ])
  }

  const removeInput = (index: number) => {
    if (inputs.length === 1) return
    const newInputs = inputs.filter((_, i) => i !== index)
    setInputs(newInputs)
    notifyParent(newInputs)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Mã lô nguồn (Input TLCs) <span className="text-red-500">*</span>
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addInput} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm lô
        </Button>
      </div>

      <div className="space-y-3">
        {inputs.map((input, index) => (
          <Card key={input.id} className="p-4">
            <div className="flex gap-3 items-start">
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`tlc-${index}`} className="text-sm">
                    Mã TLC #{index + 1}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`tlc-${index}`}
                      value={input.tlc_code}
                      onChange={(e) => handleTLCChange(index, e.target.value)}
                      onBlur={() => handleTLCBlur(index)}
                      placeholder="Nhập mã TLC (vd: TLC-2025-001)"
                      disabled={disabled}
                      className={
                        input.validation
                          ? input.validation.valid
                            ? "border-green-500 focus-visible:ring-green-500"
                            : "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {input.isValidating && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
                    {!input.isValidating && input.validation && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {input.validation.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Validation feedback */}
                  {input.validation && !input.validation.valid && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                      {input.validation.error}
                    </div>
                  )}

                  {input.validation && input.validation.valid && input.validation.tlc && (
                    <div className="text-sm bg-green-50 border border-green-200 rounded-md p-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-900">Mã lô hợp lệ</span>
                      </div>
                      <div className="text-green-700 text-xs space-y-0.5">
                        <p>
                          <strong>Sản phẩm:</strong> {input.validation.tlc.product_name}
                        </p>
                        <p>
                          <strong>Khả dụng:</strong> {input.validation.tlc.quantity} đơn vị
                        </p>
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          {input.validation.tlc.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity input - only show if TLC is valid */}
                {input.validation?.valid && (
                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${index}`} className="text-sm">
                      Số lượng sử dụng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max={input.validation.tlc?.quantity}
                      value={input.quantity_used || ""}
                      onChange={(e) => handleQuantityChange(index, Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">Tối đa: {input.validation.tlc?.quantity} đơn vị</p>
                  </div>
                )}
              </div>

              {/* Remove button */}
              {inputs.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInput(index)}
                  disabled={disabled}
                  className="mt-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
        <p className="font-medium">📋 Yêu cầu FSMA 204:</p>
        <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-800">
          <li>
            Mỗi mã lô nguồn phải đã có sự kiện <strong>Receiving</strong>
          </li>
          <li>
            Mã lô phải ở trạng thái <strong>active</strong>
          </li>
          <li>Số lượng sử dụng không được vượt quá số lượng khả dụng</li>
          <li>Transformation tạo ra mã TLC mới phải liên kết với tất cả TLC nguồn</li>
        </ul>
      </div>
    </div>
  )
}
