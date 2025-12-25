export interface TourStep {
  target: string // CSS selector
  title: string
  content: string
  placement?: "top" | "bottom" | "left" | "right" | "center"
  action?: string // Optional action text
  highlightPadding?: number
  category: "setup" | "record" | "track" | "report" | "comply"
}

export const fsmaTourSteps: TourStep[] = [
  // INTRO - Tổng quan hệ thống
  {
    target: "body",
    title: "Chào mừng đến với FSMA 204 Traceability System! 👋",
    content:
      "Hệ thống này giúp bạn tuân thủ đầy đủ Quy định Truy xuất nguồn gốc FSMA 204 của FDA. Chúng tôi sẽ hướng dẫn bạn qua **5 bước chính**: Setup → Record → Track → Report → Comply. Hãy bắt đầu!",
    placement: "center",
    category: "setup",
  },

  // PHASE 1: SETUP - Thiết lập ban đầu
  {
    target: '[data-tour="company-info"]',
    title: "1️⃣ Thiết lập: Thông tin Công ty",
    content:
      "**Bước đầu tiên**: Cập nhật đầy đủ thông tin công ty của bạn. Theo FSMA 204, mỗi doanh nghiệp phải có **Business Name** và **Registration Number** để FDA có thể xác minh.",
    placement: "top",
    action: "Đi tới Công ty",
    category: "setup",
  },

  {
    target: '[data-tour="facilities"]',
    title: "1️⃣ Thiết lập: Đăng ký Cơ sở (Facilities)",
    content:
      "**Cơ sở** là nơi xử lý, đóng gói, lưu trữ thực phẩm. Mỗi cơ sở cần có: **Địa chỉ đầy đủ**, **Tọa độ GPS** (latitude/longitude), và **Location Description**. Đây là **Key Data Element (KDE)** bắt buộc cho mọi Critical Tracking Event.",
    placement: "right",
    action: "Quản lý Cơ sở",
    category: "setup",
  },

  {
    target: '[data-tour="products"]',
    title: "1️⃣ Thiết lập: Đăng ký Sản phẩm trên Food Traceability List",
    content:
      "**Chỉ sản phẩm trên FTL mới cần theo dõi**. Ví dụ: Rau lá xanh, Trứng gà, Pho mát tươi, Hải sản tươi/đông lạnh, Các loại hạt. Đăng ký đầy đủ: **Tên sản phẩm**, **Mã sản phẩm**, **Variety/Cultivar** (nếu có).",
    placement: "right",
    action: "Quản lý Sản phẩm",
    category: "setup",
  },

  // PHASE 2: RECORD - Ghi nhận sự kiện
  {
    target: '[data-tour="tlc-codes-kpi"]',
    title: "2️⃣ Ghi nhận: Tạo Traceability Lot Code (TLC)",
    content:
      "**TLC là trái tim của FSMA 204**. Mỗi lô hàng phải có một **mã TLC duy nhất** để theo dõi từ farm đến fork. TLC thường bao gồm: **Mã sản phẩm + Ngày thu hoạch + Mã vùng trồng**. Ví dụ: `SPINACH-2025-0123-FIELD-A`",
    placement: "bottom",
    action: "Tạo mã TLC",
    category: "record",
    highlightPadding: 10,
  },

  {
    target: '[data-tour="print-labels"]',
    title: "2️⃣ Ghi nhận: In nhãn QR Code cho TLC",
    content:
      "Sau khi tạo TLC, in **QR Code** hoặc **Barcode** để dán lên thùng carton, pallet. Điều này giúp quét nhanh tại các điểm trong chuỗi cung ứng (kho, vận chuyển, cửa hàng).",
    placement: "top",
    action: "In nhãn mã",
    category: "record",
  },

  {
    target: '[data-tour="cte-events"]',
    title: "2️⃣ Ghi nhận: Tạo Critical Tracking Events (CTE)",
    content:
      "**6-7 loại CTE bắt buộc**: 1) **Harvesting** (Thu hoạch), 2) **Cooling** (Làm lạnh), 3) **Initial Packing** (Đóng gói lần đầu), 4) **Receiving** (Nhận hàng), 5) **Shipping** (Gửi hàng), 6) **Transformation** (Chế biến), 7) **First Land-based Receiving** (dành cho import). Mỗi CTE cần ghi đầy đủ **KDE**.",
    placement: "right",
    action: "Tạo sự kiện CTE",
    category: "record",
    highlightPadding: 12,
  },

  {
    target: '[data-tour="cte-approve"]',
    title: "2️⃣ Ghi nhận: Phê duyệt CTE",
    content:
      "Manager/Admin cần **review và approve** các CTE do Operator tạo. Kiểm tra xem KDE đã đầy đủ chưa: **TLC, Location, Date, Quantity, Product Description**. Chỉ CTE được duyệt mới hợp lệ cho FDA.",
    placement: "top",
    action: "Phê duyệt CTE",
    category: "record",
  },

  // PHASE 3: TRACK - Theo dõi và quét mã
  {
    target: '[data-tour="scan-qr"]',
    title: "3️⃣ Theo dõi: Quét mã TLC tại các điểm kiểm soát",
    content:
      "Sử dụng **camera smartphone hoặc máy quét** để đọc QR/Barcode trên thùng hàng. Hệ thống sẽ hiển thị ngay: **Sản phẩm gì? Đến từ đâu? Thu hoạch khi nào? CTE nào đã xảy ra?** Giúp xác minh nhanh tại kho, cửa hàng.",
    placement: "top",
    action: "Quét mã ngay",
    category: "track",
    highlightPadding: 8,
  },

  {
    target: '[data-tour="traceability"]',
    title: "3️⃣ Theo dõi: Truy xuất nguồn gốc đầy đủ",
    content:
      "Tính năng **Traceability** cho phép tra cứu toàn bộ hành trình của 1 TLC: Từ **farm location** → **cooling** → **packing** → **shipping** → **receiving** → **transformation** → **retail**. FDA yêu cầu dữ liệu này trong 24h khi có outbreak.",
    placement: "right",
    action: "Xem Truy xuất",
    category: "track",
  },

  {
    target: '[data-tour="shipments"]',
    title: "3️⃣ Theo dõi: Quản lý Vận chuyển (Shipments)",
    content:
      "Mỗi lần **gửi hàng = 1 Shipping CTE**. Ghi nhận: **Ngày gửi**, **Địa điểm nhận hàng**, **Số lượng**, **Reference document** (như số Bill of Lading). Điều này giúp truy vết nếu hàng bị nhiễm khuẩn trên đường vận chuyển.",
    placement: "right",
    action: "Xem Vận chuyển",
    category: "track",
  },

  // PHASE 4: REPORT - Báo cáo và phân tích
  {
    target: '[data-tour="reports"]',
    title: "4️⃣ Báo cáo: Tạo báo cáo FSMA 204",
    content:
      "Hệ thống tự động tổng hợp **KDE Compliance Report**: Có bao nhiêu lô hàng? Bao nhiêu % đã có đủ KDE? CTE nào còn thiếu? Báo cáo này giúp bạn **tự kiểm tra trước khi FDA audit**.",
    placement: "right",
    action: "Tạo báo cáo",
    category: "report",
  },

  // PHASE 5: COMPLY - Tuân thủ và chuẩn bị cho FDA
  {
    target: '[data-tour="notifications"]',
    title: "5️⃣ Tuân thủ: Cảnh báo tự động",
    content:
      "Hệ thống gửi **alerts tự động**: Đăng ký FDA sắp hết hạn? CTE chưa được approve quá 48h? TLC thiếu KDE? Đừng bỏ lỡ cảnh báo này để đảm bảo 100% compliance.",
    placement: "right",
    action: "Xem Cảnh báo",
    category: "comply",
  },

  {
    target: '[data-tour="ai-chatbot"]',
    title: "5️⃣ Tuân thủ: AI Assistant - Trợ lý Vexim Global 24/7",
    content:
      'Có thắc mắc về FSMA 204? Hỏi ngay **AI Chatbot**! Ví dụ: "KDE nào cần cho Harvesting?", "Thế nào là Transformation CTE?", "Làm sao tạo TLC đúng chuẩn?". AI được đào tạo trên tài liệu FDA chính thức.',
    placement: "left",
    action: "Chat với AI",
    category: "comply",
    highlightPadding: 15,
  },

  // FINAL STEP
  {
    target: "body",
    title: "🎉 Bạn đã sẵn sàng tuân thủ FSMA 204!",
    content:
      "**Các bước hoàn tất**: ✅ Setup → ✅ Record → ✅ Track → ✅ Report → ✅ Comply. Nhớ rằng FDA có thể yêu cầu hồ sơ **trong vòng 24 giờ**, nên hãy cập nhật CTE và KDE đầy đủ hàng ngày. Chúc bạn thành công! 🚀",
    placement: "center",
    category: "comply",
  },
]

// Helper để get steps theo category
export const getTourStepsByCategory = (category: TourStep["category"]) => {
  return fsmaTourSteps.filter((step) => step.category === category)
}

// Tour config
export const tourConfig = {
  showProgress: true,
  showSkipButton: true,
  exitOnOverlayClick: false,
  keyboardNavigation: true,
  disableInteraction: false,
}
