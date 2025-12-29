"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { translations, type Locale, defaultLocale } from "@/lib/i18n"
import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const t = translations[locale]

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold">FoodTrace</span>
          </div>
          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-1 border rounded-md p-1">
              <button
                onClick={() => setLocale("vi")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  locale === "vi" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                VI
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  locale === "en" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/auth/login">{t.nav.login}</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              <Link href="/auth/sign-up">{t.nav.signup}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <Badge variant="secondary" className="text-sm px-4 py-1 bg-blue-50 text-blue-700 border-blue-200">
              {t.hero.badge}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
              {t.hero.title}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                {t.hero.titleHighlight}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">{t.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="text-lg px-8 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
              >
                <Link href="/auth/sign-up">{t.hero.cta}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent">
                <Link href="#features">{t.hero.ctaSecondary}</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t.hero.noCreditCard}</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 bg-white">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.fsma.title}</h2>
            <p className="text-lg text-muted-foreground">{t.fsma.subtitle}</p>
          </div>
          <div className="max-w-4xl mx-auto space-y-12">
            {t.fsma.steps.map((step, index) => (
              <div key={index} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Visual Flow Diagram */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 p-6 bg-blue-50 rounded-lg text-center">
                <div className="text-4xl mb-2">🌾</div>
                <div className="font-semibold">Harvest / {locale === "vi" ? "Thu hoạch" : "Cooling"}</div>
              </div>
              <div className="text-2xl text-blue-600">→</div>
              <div className="flex-1 p-6 bg-teal-50 rounded-lg text-center">
                <div className="text-4xl mb-2">📦</div>
                <div className="font-semibold">Packing / {locale === "vi" ? "Đóng gói" : "Receiving"}</div>
              </div>
              <div className="text-2xl text-blue-600">→</div>
              <div className="flex-1 p-6 bg-indigo-50 rounded-lg text-center">
                <div className="text-4xl mb-2">🚚</div>
                <div className="font-semibold">Shipping / {locale === "vi" ? "Vận chuyển" : "Transformation"}</div>
              </div>
              <div className="text-2xl text-blue-600">→</div>
              <div className="flex-1 p-6 bg-green-50 rounded-lg text-center">
                <div className="text-4xl mb-2">🇺🇸</div>
                <div className="font-semibold">US Market / {locale === "vi" ? "Thị trường Mỹ" : "FDA Compliant"}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20 bg-slate-50">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {locale === "vi" ? "Tính năng nổi bật" : "Key Features"}
            </h2>
            <p className="text-lg text-muted-foreground">
              {locale === "vi"
                ? "Mọi thứ bạn cần để xuất khẩu thực phẩm an toàn sang thị trường Mỹ"
                : "Everything you need to export food safely to the US market"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {locale === "vi" ? "Theo dõi sự kiện tự động" : "Automated Event Tracking"}
              </h3>
              <p className="text-muted-foreground">
                {locale === "vi"
                  ? "Ghi nhận mọi bước từ thu hoạch đến vận chuyển. Không bỏ sót chi tiết nào, luôn sẵn sàng cho FDA."
                  : "Record every step from harvest to shipping. No detail missed, always FDA-ready."}
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {locale === "vi" ? "Mã truy xuất thông minh" : "Smart Traceability Codes"}
              </h3>
              <p className="text-muted-foreground">
                {locale === "vi"
                  ? "Tạo mã TLC cho từng lô hàng trong 30 giây. Quét QR là biết ngay nguồn gốc, không phải tìm kiếm."
                  : "Generate TLC for each batch in 30 seconds. Scan QR to instantly know origin, no searching needed."}
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {locale === "vi" ? "Báo cáo 1 cú click" : "One-Click Reports"}
              </h3>
              <p className="text-muted-foreground">
                {locale === "vi"
                  ? "Xuất báo cáo kiểm toán FSMA 204 trong 5 phút. Không cần Excel, không đau đầu khi FDA yêu cầu."
                  : "Export FSMA 204 audit reports in 5 minutes. No Excel, no headaches when FDA requests."}
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {locale === "vi" ? "Danh sách FTL đầy đủ" : "Complete FTL Database"}
              </h3>
              <p className="text-muted-foreground">
                {locale === "vi"
                  ? "Tất cả sản phẩm rủi ro cao theo FDA được đánh dấu sẵn. Bạn chỉ việc nhập dữ liệu và yên tâm."
                  : "All FDA high-risk products pre-marked. Just enter data and relax."}
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {locale === "vi" ? "Phân quyền chặt chẽ" : "Strict Access Control"}
              </h3>
              <p className="text-muted-foreground">
                {locale === "vi"
                  ? "Admin kiểm soát tài khoản, nhân viên chỉ nhập liệu. Bảo mật dữ liệu, đúng người đúng việc."
                  : "Admin controls accounts, staff only enters data. Data security, right person right task."}
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {locale === "vi" ? "Song ngữ Việt-Anh" : "Bilingual Vietnamese-English"}
              </h3>
              <p className="text-muted-foreground">
                {locale === "vi"
                  ? "Nhân viên dùng tiếng Việt, xuất báo cáo bằng tiếng Anh. Giao tiếp với đối tác Mỹ dễ như ăn kẹo."
                  : "Staff use Vietnamese, export reports in English. Communicate with US partners easily."}
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 bg-white">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.whyUs.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.whyUs.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {t.whyUs.reasons.map((reason, index) => (
              <div key={index} className="p-8 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{reason.title}</h3>
                    <p className="text-slate-700">{reason.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 bg-slate-50">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.faq.title}</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {t.faq.items.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg border px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-4 py-20 bg-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {locale === "vi" ? "Khách hàng nói gì về chúng tôi" : "What Our Customers Say"}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-50 p-6 rounded-lg border">
              <p className="text-slate-700 mb-4">
                {locale === "vi"
                  ? '"Trước đây mất 2 tuần để chuẩn bị hồ sơ kiểm toán, giờ chỉ 1 tiếng. Xuất khẩu sang Mỹ dễ hơn nhiều!"'
                  : '"Used to take 2 weeks to prepare audit records, now just 1 hour. Exporting to US is so much easier!"'}
              </p>
              <p className="font-semibold">{locale === "vi" ? "Nguyễn Thị Lan" : "Lan Nguyen"}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "vi" ? "Giám đốc - Công ty Hải sản Việt" : "Director - Vietnam Seafood Co."}
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-lg border">
              <p className="text-slate-700 mb-4">
                {locale === "vi"
                  ? '"Hệ thống dễ dùng, nhân viên học được ngay. Không cần thuê chuyên gia tư vấn tốn kém nữa."'
                  : '"Easy to use system, staff learned immediately. No need to hire expensive consultants anymore."'}
              </p>
              <p className="font-semibold">{locale === "vi" ? "Trần Văn Hùng" : "Hung Tran"}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "vi" ? "Quản lý QC - Nông sản An Giang" : "QC Manager - An Giang Produce"}
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-lg border">
              <p className="text-slate-700 mb-4">
                {locale === "vi"
                  ? '"FDA yêu cầu dữ liệu trong 24h, chúng tôi gửi sau 1 tiếng. Khách hàng Mỹ rất hài lòng!"'
                  : '"FDA requested data within 24h, we sent it in 1 hour. US customers are very satisfied!"'}
              </p>
              <p className="font-semibold">{locale === "vi" ? "Lê Minh Tuấn" : "Tuan Le"}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "vi" ? "CEO - Fresh Fruit Export" : "CEO - Fresh Fruit Export"}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 bg-gradient-to-br from-blue-600 to-teal-600 text-white rounded-3xl my-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">
              {locale === "vi" ? "Sẵn sàng xuất khẩu an toàn?" : "Ready to Export Safely?"}
            </h2>
            <p className="text-lg text-blue-50">
              {locale === "vi"
                ? "Bắt đầu dùng thử miễn phí 14 ngày. Đội ngũ hỗ trợ tiếng Việt luôn sẵn sàng."
                : "Start your 14-day free trial. Vietnamese-speaking support team always ready."}
            </p>
            <Button size="lg" className="text-lg px-8 bg-white text-blue-600 hover:bg-blue-50">
              <Link href="/auth/sign-up">
                {locale === "vi" ? "Yêu cầu demo miễn phí ngay" : "Request Free Demo Now"}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            {locale === "vi"
              ? "© 2025 FoodTrace. Hệ thống truy xuất nguồn gốc thực phẩm FSMA 204."
              : "© 2025 FoodTrace. FSMA 204 Food Traceability System."}
          </p>
        </div>
      </footer>
    </div>
  )
}
