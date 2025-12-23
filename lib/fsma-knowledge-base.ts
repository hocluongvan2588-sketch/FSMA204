// FSMA 204 Knowledge Base - Kiến thức giáo dục chuyên sâu về FSMA
export interface FSMAKnowledge {
  content: string
  icon: string
}

const fsmaKnowledgeBase: FSMAKnowledge[] = [
  // Hạn chót và Tuân thủ (Cập nhật quan trọng nhất)
  {
    content:
      "**Bạn có biết:** Hạn chót chính thức để tuân thủ **FSMA 204** là ngày **20 tháng 7, 2028**. Doanh nghiệp cần ít nhất 12-18 tháng để chuẩn bị hệ thống, vì vậy việc bắt đầu ngay từ bây giờ là vô cùng cấp thiết.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** **FSMA 204** áp dụng cho cả doanh nghiệp trong nước Mỹ và các **Nhà xuất khẩu nước ngoài**. Nếu sản phẩm của bạn nằm trong danh mục FTL, bạn phải tuân thủ đầy đủ các quy định về lưu trữ hồ sơ để hàng hóa được phép nhập cảnh.",
    icon: "",
  },

  // Key Data Elements (KDE) - Dữ liệu then chốt
  {
    content:
      "**Bạn có biết:** **Key Data Elements (KDE)** là các trường dữ liệu cụ thể phải được ghi lại cho mỗi sự kiện truy xuất. Thiếu bất kỳ một KDE nào trong báo cáo đều có thể khiến lô hàng bị coi là **không tuân thủ**.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** KDE về **Location Description** (Mô tả vị trí) không chỉ là địa chỉ. Nó phải bao gồm tên cơ sở, địa chỉ chi tiết và **số đăng ký FDA (Food Facility Registration)** của nơi sản xuất hoặc lưu trữ.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Đối với các nông trại, **Tọa độ địa lý (GPS Coordinates)** là một KDE bắt buộc. Phải cung cấp chính xác vĩ độ và kinh độ của vùng trồng để FDA có thể khoanh vùng nguồn gốc ô nhiễm trên bản đồ vệ tinh.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** **Reference Document Type** và **Number** là các KDE giúp liên kết hồ sơ điện tử với chứng từ thực tế. Bạn phải ghi rõ đó là **Vận đơn (Bill of Lading)**, **Hóa đơn (Invoice)** hay **Số đơn hàng (PO)**.",
    icon: "",
  },

  // Critical Tracking Events (CTE) - Sự kiện quan trọng
  {
    content:
      "**Bạn có biết:** **Critical Tracking Events (CTE)** là các điểm nút trong chuỗi cung ứng nơi dữ liệu được tạo ra. Có 7 loại CTE chính: **Harvesting, Cooling, Initial Packing, First Land-based Receiving, Shipping, Receiving,** và **Transformation**.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Sự kiện **Harvesting (Thu hoạch)** yêu cầu ghi nhận KDE về tên người thu hoạch, tên cánh đồng, và số lượng thu hoạch. Đây là điểm khởi đầu của toàn bộ chuỗi truy xuất nguồn gốc.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** **Initial Packing (Đóng gói đầu)** là CTE quan trọng nhất đối với nông sản tươi. Đây là nơi mã **Traceability Lot Code (TLC)** đầu tiên được gán cho sản phẩm.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** **Transformation (Chuyển đổi)** là khi một thực phẩm trong danh mục FTL được dùng làm nguyên liệu để tạo ra sản phẩm mới. Sự kiện này bắt buộc phải tạo ra một **TLC mới** và ghi lại liên kết với mã nguyên liệu cũ.",
    icon: "",
  },

  // Traceability Lot Code (TLC) - Mã lô truy xuất
  {
    content:
      "**Bạn có biết:** **Traceability Lot Code (TLC)** là 'chứng minh nhân dân' của lô hàng. Chỉ có **TLC Source** (người tạo ra mã lô tại điểm đóng gói hoặc chuyển đổi) mới có quyền định danh mã này.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Một khi mã **TLC** đã được gán, các bên tiếp theo trong chuỗi cung ứng như nhà kho hay đại lý phân phối **không được phép thay đổi** mã này khi vận chuyển hàng đi.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** **Traceability Lot Code Source Reference** là thông tin giúp FDA biết ai là người đã gán mã lô đó. Nó thường là số đăng ký FDA hoặc mã số doanh nghiệp của người đóng gói đầu tiên.",
    icon: "",
  },

  // Food Traceability List (FTL) - Danh mục thực phẩm
  {
    content:
      "**Bạn có biết:** **Food Traceability List (FTL)** bao gồm các thực phẩm nguy cơ cao như: **Rau xanh (Lettuce, Spinach), Dưa (Melons), Trứng, Hải sản tươi sống, và các loại Phô mai mềm**.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Các loại **Hải sản** như Cá ngừ, Cá hồi, Tôm, và Động vật giáp xác đều nằm trong danh mục FTL. Quy định áp dụng cho cả hàng tươi sống, hàng đông lạnh và hàng đã chế biến nhưng chưa qua bước tiêu diệt vi sinh hoàn toàn.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** **Phô mai cứng** (như Parmesan hoặc Cheddar) không nằm trong danh mục FTL vì độ ẩm thấp không hỗ trợ vi khuẩn phát triển, trong khi **Phô mai mềm** thì bắt buộc phải truy xuất nghiêm ngặt.",
    icon: "",
  },

  // Lưu trữ hồ sơ và Công nghệ
  {
    content:
      "**Bạn có biết:** Khi FDA yêu cầu điều tra, bạn phải cung cấp hồ sơ dưới dạng **Electronic Sortable Spreadsheet** (Bảng tính điện tử có thể sắp xếp) trong vòng tối đa **24 giờ**.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Hồ sơ truy xuất nguồn gốc phải được lưu giữ trong ít nhất **2 năm**. Bạn có thể lưu trữ tại cơ sở hoặc lưu trữ trên **Đám mây (Cloud)**, miễn là có thể truy cập ngay khi cần.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** FDA không bắt buộc sử dụng một phần mềm cụ thể nào, nhưng họ khuyến khích sử dụng các tiêu chuẩn quốc tế như **GS1 EPCIS** để việc trao đổi dữ liệu giữa các bên trong chuỗi cung ứng được tự động hóa.",
    icon: "",
  },

  // Vai trò First Receiver (Người nhận đầu tiên)
  {
    content:
      "**Bạn có biết:** **First Receiver** là thực thể đầu tiên nhận thực phẩm FTL từ một nông trại được miễn trừ hoặc từ tàu đánh bắt. Họ có trách nhiệm 'số hóa' thông tin từ nông dân để đưa vào hệ thống truy xuất.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Nếu bạn là **First Receiver**, bạn phải ghi lại thông tin về vùng trồng của nông dân ngay cả khi nông dân đó không phải làm báo cáo FSMA 204. Nếu thiếu, lô hàng sẽ bị đứt gãy chuỗi truy xuất.",
    icon: "",
  },

  // Miễn trừ (Exemptions)
  {
    content:
      "**Bạn có biết:** Có một số trường hợp được **Miễn trừ (Exemptions)**, ví dụ như nông sản được bán trực tiếp từ nông trại đến người tiêu dùng, hoặc thực phẩm được chế biến qua bước **Kill Step** (như đóng hộp tiệt trùng).",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Nếu một thực phẩm FTL được sử dụng như một thành phần trong thực phẩm không thuộc FTL và đã qua chế biến nhiệt hoàn toàn, nó có thể được miễn trừ các yêu cầu truy xuất ở các khâu sau đó.",
    icon: "",
  },

  // Xử phạt và Rủi ro
  {
    content:
      "**Bạn có biết:** Việc không duy trì hồ sơ truy xuất đầy đủ có thể bị coi là **Hành vi vi phạm pháp luật liên bang**. FDA có thể ban hành lệnh **Thu hồi bắt buộc** đối với tất cả sản phẩm không rõ nguồn gốc.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Các nhà bán lẻ lớn tại Mỹ như **Walmart, Whole Foods, và Costco** đang yêu cầu nhà cung cấp tuân thủ FSMA 204 sớm hơn thời hạn của FDA để bảo vệ uy tín thương hiệu của họ.",
    icon: "",
  },

  // Lợi ích vận hành
  {
    content:
      "**Bạn có biết:** Chuyển đổi sang hệ thống **Truy xuất nguồn gốc điện tử** giúp giảm lãng phí thực phẩm bằng cách quản lý kho theo thời gian thực và xác định chính xác lô hàng cần thu hồi thay vì thu hồi toàn bộ kho.",
    icon: "",
  },
  {
    content:
      "**Bạn có biết:** Việc áp dụng **FSMA 204** một cách chuyên nghiệp giúp doanh nghiệp nâng cao niềm tin với khách hàng, chứng minh sự minh bạch và trách nhiệm đối với an toàn sức khỏe cộng đồng.",
    icon: "",
  },
]

export function getFSMAKnowledge(): FSMAKnowledge {
  // Use random selection instead of day-based to ensure content changes
  const randomIndex = Math.floor(Math.random() * fsmaKnowledgeBase.length)
  return fsmaKnowledgeBase[randomIndex]
}

export function getDailyFSMAKnowledge(): FSMAKnowledge {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
  const index = dayOfYear % fsmaKnowledgeBase.length
  return fsmaKnowledgeBase[index]
}
