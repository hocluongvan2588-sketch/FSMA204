import type { EducationContent } from "@/types/education-hub"

// Default education content library for FSMA204
export const educationLibrary: EducationContent[] = [
  {
    id: "1",
    type: "education",
    priority: "low",
    tag: "KIẾN THỨC FSMA",
    title: "FSMA 204 là gì và tại sao quan trọng?",
    content:
      "FSMA 204 là quy định truy xuất nguồn gốc thực phẩm của FDA Hoa Kỳ, yêu cầu theo dõi các sản phẩm trong Food Traceability List (FTL) từ nguồn gốc đến người tiêu dùng.",
    cta_label: "Tìm hiểu thêm",
    link: "/dashboard/wiki/fsma204",
  },
  {
    id: "2",
    type: "education",
    priority: "low",
    tag: "HƯỚNG DẪN",
    title: "Critical Tracking Events (CTE) - Sự kiện theo dõi quan trọng",
    content:
      "CTE bao gồm 6 loại chính: Thu hoạch, Làm lạnh, Đóng gói ban đầu, Nhận hàng, Chuyển đổi, và Vận chuyển. Mỗi CTE phải ghi nhận đầy đủ KDE.",
    cta_label: "Xem ví dụ",
    link: "/dashboard/cte",
  },
  {
    id: "3",
    type: "education",
    priority: "low",
    tag: "MẸO VẬN HÀNH",
    title: "Key Data Elements (KDE) - Dữ liệu quan trọng",
    content:
      "KDE là các thông tin bắt buộc phải ghi nhận cho mỗi CTE như Traceability Lot Code (TLC), ngày giờ, địa điểm, số lượng, và đơn vị đo lường.",
    cta_label: "Danh sách KDE",
    link: "/dashboard/wiki/kde",
  },
  {
    id: "4",
    type: "legal",
    priority: "medium",
    tag: "CẬP NHẬT PHÁP LÝ",
    title: "Hạn chót tuân thủ FSMA 204: Ngày 20 tháng 1, 2026",
    content:
      "Tất cả các doanh nghiệp trong chuỗi cung ứng thực phẩm phải tuân thủ đầy đủ các yêu cầu truy xuất nguồn gốc trước ngày này. Hãy chuẩn bị sẵn sàng!",
    cta_label: "Xem chi tiết",
    link: "/dashboard/compliance",
  },
  {
    id: "5",
    type: "education",
    priority: "low",
    tag: "KIẾN THỨC",
    title: "Food Traceability List (FTL) - Danh sách thực phẩm bắt buộc",
    content:
      "FTL bao gồm các sản phẩm như rau xanh lá, các loại củ, trái cây nhiệt đới, hải sản, và nhiều loại thực phẩm khác. Kiểm tra xem sản phẩm của bạn có trong danh sách không.",
    cta_label: "Xem FTL",
    link: "/dashboard/wiki/ftl",
  },
]

// Function to get prioritized content
export function getPrioritizedContent(deviceStatus = "normal", complianceScore = 100): EducationContent | null {
  // Priority 1: High priority maintenance alerts
  const highPriorityContent = educationLibrary.filter((content) => content.priority === "high")

  if (highPriorityContent.length > 0) {
    return highPriorityContent[0]
  }

  // Priority 2: Medium priority legal updates
  const mediumPriorityContent = educationLibrary.filter((content) => content.priority === "medium")

  if (mediumPriorityContent.length > 0) {
    return mediumPriorityContent[Math.floor(Math.random() * mediumPriorityContent.length)]
  }

  // Priority 3: Low priority educational content (randomized)
  const lowPriorityContent = educationLibrary.filter((content) => content.priority === "low")

  if (lowPriorityContent.length > 0) {
    return lowPriorityContent[Math.floor(Math.random() * lowPriorityContent.length)]
  }

  return null
}
