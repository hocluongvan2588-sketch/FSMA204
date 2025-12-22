"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface WelcomeStepProps {
  onNext: () => void
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <Card className="border-2">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center mx-auto">
            <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Chào mừng đến với FoodTrace!</h2>
            <p className="text-lg text-slate-600">
              Hệ thống truy xuất nguồn gốc thực phẩm đầu tiên tại Việt Nam tuân thủ hoàn toàn FSMA 204 của FDA Hoa Kỳ
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Thiết lập nhanh chóng trong 4 bước
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  1
                </span>
                <span>
                  <strong>Chọn ngành hàng:</strong> Thủy sản, nông sản, hoặc chế biến thực phẩm
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  2
                </span>
                <span>
                  <strong>Thông tin công ty:</strong> Điền thông tin cơ bản về doanh nghiệp của bạn
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  3
                </span>
                <span>
                  <strong>Thêm cơ sở:</strong> Trang trại, nhà máy, kho lạnh (chúng tôi có sẵn mẫu)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  4
                </span>
                <span>
                  <strong>Thêm sản phẩm:</strong> Danh sách sản phẩm xuất khẩu của bạn
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button size="lg" onClick={onNext} className="bg-gradient-to-r from-blue-600 to-teal-600 text-lg px-8">
              Bắt đầu ngay
              <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>

          <p className="text-sm text-slate-500">
            Bạn có thể lưu và tiếp tục sau bất cứ lúc nào. Dữ liệu được tự động lưu sau mỗi bước.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
