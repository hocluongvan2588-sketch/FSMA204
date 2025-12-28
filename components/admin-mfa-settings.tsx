"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Shield, ShieldCheck, ShieldAlert, Key, AlertTriangle } from "lucide-react"
import { checkMFAStatus, enrollMFAFactor, verifyMFAEnrollment, unenrollMFAFactor } from "@/lib/auth/mfa-helpers"
import { logMFAEnrollment, logMFAVerification, logMFAUnenrollment } from "@/app/actions/mfa-actions"
import Image from "next/image"

export function AdminMFASettings() {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [factors, setFactors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadMFAStatus()
  }, [])

  const loadMFAStatus = async () => {
    setLoading(true)
    const status = await checkMFAStatus()
    setMfaEnabled(status.enabled)
    setFactors(status.factors)
    setLoading(false)
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    setError(null)

    const result = await enrollMFAFactor("Admin Authenticator")

    if (result.success && result.qrCode && result.secret && result.factorId) {
      setQrCode(result.qrCode)
      setSecret(result.secret)
      setFactorId(result.factorId)
      await logMFAEnrollment("Admin Authenticator", result.factorId)
    } else {
      setError(result.error || "Không thể bắt đầu đăng ký 2FA")
      setEnrolling(false)
    }
  }

  const handleVerifyEnrollment = async () => {
    if (!factorId || !verificationCode) {
      setError("Vui lòng nhập mã xác thực")
      return
    }

    setLoading(true)
    setError(null)

    const result = await verifyMFAEnrollment(factorId, verificationCode)

    await logMFAVerification(factorId, result.success, result.error)

    if (result.success) {
      setSuccess("2FA đã được kích hoạt thành công!")
      setEnrolling(false)
      setQrCode(null)
      setSecret(null)
      setFactorId(null)
      setVerificationCode("")
      await loadMFAStatus()
    } else {
      setError(result.error || "Mã xác thực không chính xác")
    }

    setLoading(false)
  }

  const handleUnenroll = async (factorId: string) => {
    if (!confirm("Bạn có chắc chắn muốn tắt 2FA? Điều này sẽ làm giảm bảo mật tài khoản của bạn.")) {
      return
    }

    setLoading(true)
    setError(null)

    const result = await unenrollMFAFactor(factorId)

    if (result.success) {
      await logMFAUnenrollment(factorId)
      setSuccess("2FA đã được tắt")
      await loadMFAStatus()
    } else {
      setError(result.error || "Không thể tắt 2FA")
    }

    setLoading(false)
  }

  const handleCancelEnrollment = () => {
    setEnrolling(false)
    setQrCode(null)
    setSecret(null)
    setFactorId(null)
    setVerificationCode("")
    setError(null)
  }

  if (loading && !enrolling) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Shield className="h-8 w-8 text-slate-400 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {mfaEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <Shield className="h-5 w-5 text-slate-400" />
                )}
                Xác thực 2 yếu tố (2FA)
              </CardTitle>
              <CardDescription>Bảo vệ tài khoản admin của bạn với lớp bảo mật bổ sung</CardDescription>
            </div>
            <Badge variant={mfaEnabled ? "default" : "secondary"} className={mfaEnabled ? "bg-green-600" : ""}>
              {mfaEnabled ? "Đã bật" : "Chưa bật"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {!mfaEnabled && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <strong>Khuyến nghị bảo mật:</strong> Bật 2FA để bảo vệ tài khoản admin của bạn khỏi truy cập trái phép.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {mfaEnabled && factors.length > 0 ? (
              <div className="space-y-3">
                {factors.map((factor) => (
                  <div key={factor.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Key className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{factor.friendly_name || "Authenticator"}</p>
                        <p className="text-sm text-slate-500">
                          Đã kích hoạt lúc {new Date(factor.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => handleUnenroll(factor.id)} disabled={loading}>
                      Tắt 2FA
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <ShieldAlert className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium">2FA chưa được cấu hình</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Sử dụng ứng dụng xác thực (Google Authenticator, Authy, ...) để bảo vệ tài khoản
                  </p>
                </div>
                <Button onClick={handleEnroll} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  <Shield className="h-4 w-4 mr-2" />
                  Bật 2FA
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={enrolling} onOpenChange={handleCancelEnrollment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cài đặt xác thực 2 yếu tố</DialogTitle>
            <DialogDescription>Quét mã QR bằng ứng dụng xác thực của bạn</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCode && (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white border-2 border-slate-200 rounded-lg">
                  <Image src={qrCode || "/placeholder.svg"} alt="QR Code" width={200} height={200} />
                </div>

                {secret && (
                  <div className="w-full">
                    <p className="text-sm text-slate-600 mb-2">Hoặc nhập mã thủ công:</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                      <code className="flex-1 text-sm font-mono">{secret}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(secret)
                          setSuccess("Đã sao chép mã!")
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                <div className="w-full space-y-2">
                  <label className="text-sm font-medium">Nhập mã xác thực 6 chữ số</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelEnrollment} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleVerifyEnrollment} disabled={loading || verificationCode.length !== 6}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
