export const translations = {
  en: {
    // Navigation
    nav: {
      login: "Login",
      signup: "Request Demo",
      features: "Features",
      pricing: "Pricing",
      contact: "Contact",
    },
    // Hero
    hero: {
      badge: "Trusted by 500+ food exporters to the US",
      title: "Track your food journey from",
      titleHighlight: "farm to table",
      subtitle:
        "Export food to the US easily with automated traceability system. Save 80% audit time, comply with FSMA 204 in minutes.",
      cta: "Start 14-day free trial",
      ctaSecondary: "Explore features",
      noCreditCard: "No credit card required • Cancel anytime",
    },
    // Why Us
    whyUs: {
      title: "Why choose FoodTrace?",
      subtitle: "The only FSMA 204 platform built specifically for Vietnamese exporters",
      reasons: [
        {
          title: "Built by exporters, for exporters",
          description:
            "We understand the pain of FDA audits. Our founders exported seafood for 10+ years and built the tool they wished existed.",
        },
        {
          title: "Vietnamese-speaking support team",
          description:
            "No more Google Translate confusion. Our team speaks Vietnamese and understands local business culture.",
        },
        {
          title: "Guaranteed FDA compliance",
          description:
            "We stay updated with every FSMA rule change. If FDA rejects your records due to our system, we'll refund 100%.",
        },
        {
          title: "All-in-one platform",
          description:
            "Stop juggling Excel, emails, and paper. Everything from harvest to shipping in one secure place.",
        },
      ],
    },
    // FSMA Process
    fsma: {
      title: "How FSMA 204 works",
      subtitle: "Understand the compliance process in 3 simple steps",
      steps: [
        {
          number: "01",
          title: "Critical Tracking Events (CTE)",
          description:
            "Record key moments: harvest, cooling, packing, receiving, transformation, and shipping. These are the events FDA will audit.",
        },
        {
          number: "02",
          title: "Key Data Elements (KDE)",
          description:
            "For each CTE, capture required details: location, date, quantity, temperature, supplier info. No missing data means no penalties.",
        },
        {
          number: "03",
          title: "Traceability Lot Code (TLC)",
          description:
            "Assign unique codes to each batch. FDA can request records within 24 hours - you'll have everything ready in minutes.",
        },
      ],
    },
    // FAQ
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          q: "Do I really need FSMA 204 compliance?",
          a: "Yes, if you export foods on the FDA's Food Traceability List (FTL) to the US - including seafood, fresh produce, and nut butter. Non-compliance means shipment rejection and fines.",
        },
        {
          q: "How long does setup take?",
          a: "Most companies finish setup in 1-2 days. Our Vietnamese-speaking onboarding team guides you through every step, from company profile to first shipment record.",
        },
        {
          q: "Can I use this if I don't speak English?",
          a: "The entire interface is in Vietnamese. Reports are auto-translated to English for FDA. Your team works in Vietnamese, FDA sees perfect English.",
        },
        {
          q: "What happens if FDA audits me?",
          a: "Click one button to generate the complete audit report. FDA typically gives 24 hours notice - you'll have everything ready in 10 minutes.",
        },
        {
          q: "Is my data secure?",
          a: "Bank-level encryption, daily backups, and ISO 27001 certified data centers. Your records are safer than paper files or Excel sheets.",
        },
        {
          q: "Can I try before buying?",
          a: "Yes! 14-day free trial with full features. No credit card needed. Our team will help you set up a test shipment to see exactly how it works.",
        },
      ],
    },
    // Dashboard Navigation
    dashboard: {
      nav: {
        overview: "Overview",
        company: "Company",
        facilities: "Facilities",
        products: "Products",
        lots: "TLC Codes",
        cte: "CTE Events",
        shipments: "Shipments",
        reports: "Reports",
        signOut: "Sign Out",
      },
      overview: {
        title: "Dashboard Overview",
        subtitle: "Monitor your food traceability compliance in real-time",
        stats: {
          activeLots: "Active Lots",
          cteEvents: "CTE Events Today",
          facilities: "Active Facilities",
          compliance: "Compliance Rate",
        },
        quickActions: {
          title: "Quick Actions",
          createCTE: "Record CTE Event",
          createLot: "Create New Lot",
          viewReports: "View Reports",
        },
        recentActivity: {
          title: "Recent Activity",
          empty: "No recent activity",
          emptyDesc: "Start tracking by creating your first CTE event",
          createFirst: "Create first event in 30 seconds",
        },
      },
    },
    // Company Management
    company: {
      title: "Company Profile",
      create: "Create Company",
      edit: "Edit Company",
      save: "Save Changes",
      fields: {
        name: "Company Name",
        namePlaceholder: "Enter company name",
        taxId: "Tax ID / Business Registration",
        taxIdPlaceholder: "Enter tax ID",
        address: "Address",
        addressPlaceholder: "Enter complete address",
        phone: "Phone Number",
        phonePlaceholder: "Enter phone number",
        email: "Contact Email",
        emailPlaceholder: "Enter email",
        certifications: "Certifications",
        certificationsPlaceholder: "FDA Registration, HACCP, etc.",
      },
      info: {
        title: "Company Information",
        facilities: "Total Facilities",
        products: "Total Products",
      },
    },
    // Facilities
    facilities: {
      title: "Facilities Management",
      create: "Add New Facility",
      empty: "No facilities yet",
      emptyDesc: "Add your first production or storage facility",
      fields: {
        name: "Facility Name",
        type: "Facility Type",
        address: "Address",
        phone: "Phone",
        manager: "Manager Name",
        status: "Status",
      },
      types: {
        farm: "Farm / Harvest Site",
        processing: "Processing Plant",
        warehouse: "Cold Storage / Warehouse",
        packing: "Packing Facility",
        distribution: "Distribution Center",
      },
      status: {
        active: "Active",
        inactive: "Inactive",
        maintenance: "Under Maintenance",
      },
    },
    // Products
    products: {
      title: "Products Management",
      create: "Add New Product",
      empty: "No products yet",
      emptyDesc: "Add your first product to start tracking",
      fields: {
        name: "Product Name",
        namePlaceholder: "e.g., Fresh Shrimp",
        nameEn: "Product Name (English)",
        nameEnPlaceholder: "For FDA reports",
        category: "Category",
        scientificName: "Scientific Name",
        scientificNamePlaceholder: "e.g., Penaeus vannamei",
        onFtl: "On Food Traceability List (FTL)",
        requiresCte: "Requires CTE Tracking",
        description: "Description",
      },
      categories: {
        seafood: "Seafood",
        produce: "Fresh Produce",
        dairy: "Dairy Products",
        meat: "Meat & Poultry",
        nuts: "Nuts & Seeds",
        other: "Other",
      },
      details: {
        title: "Product Details",
        recentLots: "Recent Lots",
        ftlBadge: "On FTL",
        cteBadge: "Requires CTE",
      },
    },
    // TLC Lots
    lots: {
      title: "Traceability Lot Codes (TLC)",
      create: "Create New Lot",
      empty: "No lots yet",
      emptyDesc: "Create your first traceability lot code",
      fields: {
        lotCode: "Lot Code",
        lotCodePlaceholder: "Auto-generated or custom",
        product: "Product",
        quantity: "Quantity",
        quantityPlaceholder: "e.g., 1000",
        unit: "Unit",
        productionDate: "Production Date",
        expiryDate: "Expiry Date",
        status: "Status",
        notes: "Notes",
      },
      units: {
        kg: "Kilograms (kg)",
        lbs: "Pounds (lbs)",
        boxes: "Boxes",
        pallets: "Pallets",
      },
      status: {
        active: "Active",
        shipped: "Shipped",
        expired: "Expired",
        recalled: "Recalled",
      },
      details: {
        title: "Lot Details",
        info: "Lot Information",
        cteEvents: "CTE Events for This Lot",
      },
    },
    // CTE Events
    cte: {
      title: "Critical Tracking Events (CTE)",
      create: "Record New CTE",
      empty: "No CTE events yet",
      emptyDesc: "Start tracking by recording your first critical event",
      fields: {
        eventType: "Event Type",
        lot: "Traceability Lot",
        facility: "Facility / Location",
        eventDate: "Event Date & Time",
        quantity: "Quantity Handled",
        temperature: "Temperature",
        temperaturePlaceholder: "e.g., -18",
        notes: "Notes / Observations",
      },
      types: {
        harvest: "Harvest / Catch",
        cooling: "Initial Cooling",
        packing: "Packing",
        receiving: "Receiving",
        transformation: "Transformation / Processing",
        shipping: "Shipping",
      },
      details: {
        title: "CTE Event Details",
        info: "Event Information",
        kde: "Key Data Elements (KDE)",
      },
    },
    // Shipments
    shipments: {
      title: "Shipments Tracking",
      create: "Create New Shipment",
      empty: "No shipments yet",
      emptyDesc: "Start tracking your first shipment to the US",
      fields: {
        shipmentCode: "Shipment Code",
        lot: "Traceability Lot",
        destination: "Destination",
        carrier: "Carrier / Shipping Line",
        departureDate: "Departure Date",
        arrivalDate: "Expected Arrival Date",
        status: "Status",
        temperature: "Transport Temperature",
        containerNumber: "Container Number",
        sealNumber: "Seal Number",
      },
      status: {
        preparing: "Preparing",
        inTransit: "In Transit",
        arrived: "Arrived",
        cleared: "Customs Cleared",
        delivered: "Delivered",
      },
    },
    // Reports
    reports: {
      title: "Reports & Compliance",
      create: "Create Audit Report",
      generate: "Generate FSMA Report",
      empty: "No reports yet",
      emptyDesc: "Generate your first compliance report",
      fields: {
        title: "Report Title",
        type: "Report Type",
        dateRange: "Date Range",
        findings: "Findings",
        status: "Compliance Status",
        auditor: "Auditor Name",
        notes: "Notes",
      },
      types: {
        internal: "Internal Audit",
        external: "External Audit",
        fda: "FDA Inspection",
        customer: "Customer Audit",
      },
      compliance: {
        compliant: "Compliant",
        minor: "Minor Issues",
        major: "Major Issues",
        critical: "Critical Issues",
      },
      templates: {
        title: "Report Templates",
        fullTrace: "Full Traceability Report",
        lotHistory: "Lot History Report",
        cteLog: "CTE Event Log",
        facilityAudit: "Facility Audit Report",
      },
    },
    // Common
    common: {
      actions: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        view: "View Details",
        back: "Back",
        search: "Search",
        filter: "Filter",
        export: "Export",
        print: "Print",
        create: "Create",
        submit: "Submit",
      },
      messages: {
        success: "Operation successful",
        error: "An error occurred",
        loading: "Loading...",
        noData: "No data available",
        selectOption: "Select an option",
      },
      validation: {
        required: "This field is required",
        invalidEmail: "Invalid email address",
        invalidPhone: "Invalid phone number",
      },
    },
  },
  vi: {
    // Navigation
    nav: {
      login: "Đăng nhập",
      signup: "Yêu cầu demo",
      features: "Tính năng",
      pricing: "Bảng giá",
      contact: "Liên hệ",
    },
    // Hero
    hero: {
      badge: "Đã giúp hơn 500+ doanh nghiệp xuất khẩu thực phẩm sang Mỹ",
      title: "Theo dõi hành trình thực phẩm từ",
      titleHighlight: "nông trại đến bàn ăn",
      subtitle:
        "Xuất khẩu thực phẩm sang Mỹ dễ dàng với hệ thống truy xuất nguồn gốc tự động. Tiết kiệm 80% thời gian kiểm toán, tuân thủ đầy đủ FSMA 204 chỉ trong vài phút.",
      cta: "Dùng thử miễn phí 14 ngày",
      ctaSecondary: "Khám phá tính năng",
      noCreditCard: "Không cần thẻ tín dụng • Hủy bất cứ lúc nào",
    },
    // Why Us
    whyUs: {
      title: "Tại sao chọn FoodTrace?",
      subtitle: "Nền tảng FSMA 204 duy nhất được xây dựng riêng cho doanh nghiệp xuất khẩu Việt Nam",
      reasons: [
        {
          title: "Do người xuất khẩu xây dựng",
          description:
            "Chúng tôi hiểu nỗi đau khi bị FDA kiểm toán. Người sáng lập xuất khẩu hải sản 10+ năm và tạo ra công cụ mà họ ước có từ trước.",
        },
        {
          title: "Hỗ trợ tiếng Việt 24/7",
          description:
            "Không còn nhầm lẫn với Google Dịch. Đội ngũ của chúng tôi nói tiếng Việt và hiểu văn hóa kinh doanh địa phương.",
        },
        {
          title: "Cam kết tuân thủ FDA 100%",
          description:
            "Chúng tôi cập nhật mọi thay đổi của FSMA. Nếu FDA từ chối hồ sơ do lỗi hệ thống, hoàn tiền 100%.",
        },
        {
          title: "Nền tảng tất cả trong một",
          description:
            "Dừng việc dùng Excel, email, giấy tờ rời rạc. Mọi thứ từ thu hoạch đến vận chuyển ở một nơi an toàn.",
        },
      ],
    },
    // FSMA Process
    fsma: {
      title: "Quy trình FSMA 204 hoạt động như thế nào",
      subtitle: "Hiểu quy trình tuân thủ qua 3 bước đơn giản",
      steps: [
        {
          number: "01",
          title: "Sự kiện theo dõi quan trọng (CTE)",
          description:
            "Ghi nhận các thời điểm chính: thu hoạch, làm lạnh, đóng gói, tiếp nhận, chế biến và vận chuyển. Đây là những sự kiện FDA sẽ kiểm toán.",
        },
        {
          number: "02",
          title: "Yếu tố dữ liệu chính (KDE)",
          description:
            "Với mỗi CTE, ghi lại chi tiết bắt buộc: địa điểm, ngày tháng, số lượng, nhiệt độ, thông tin nhà cung cấp. Không thiếu dữ liệu = không bị phạt.",
        },
        {
          number: "03",
          title: "Mã truy xuất nguồn gốc (TLC)",
          description:
            "Gán mã duy nhất cho mỗi lô hàng. FDA có thể yêu cầu hồ sơ trong 24 giờ - bạn sẽ có mọi thứ sẵn sàng trong vài phút.",
        },
      ],
    },
    // FAQ
    faq: {
      title: "Câu hỏi thường gặp",
      items: [
        {
          q: "Tôi có thực sự cần tuân thủ FSMA 204 không?",
          a: "Có, nếu bạn xuất khẩu thực phẩm trong Danh sách Truy xuất Thực phẩm (FTL) của FDA sang Mỹ - bao gồm hải sản, nông sản tươi và bơ hạt. Không tuân thủ có nghĩa là lô hàng bị từ chối và phạt tiền.",
        },
        {
          q: "Mất bao lâu để thiết lập?",
          a: "Hầu hết doanh nghiệp hoàn tất thiết lập trong 1-2 ngày. Đội ngũ hướng dẫn tiếng Việt của chúng tôi sẽ dẫn bạn qua từng bước, từ hồ sơ công ty đến ghi nhận lô hàng đầu tiên.",
        },
        {
          q: "Tôi có thể dùng nếu không biết tiếng Anh?",
          a: "Hoàn toàn được! Toàn bộ giao diện bằng tiếng Việt. Báo cáo tự động dịch sang tiếng Anh cho FDA. Nhóm của bạn làm việc bằng tiếng Việt, FDA nhìn thấy tiếng Anh hoàn hảo.",
        },
        {
          q: "Điều gì xảy ra nếu FDA kiểm toán tôi?",
          a: "Nhấp một nút để tạo báo cáo kiểm toán đầy đủ. FDA thường thông báo trước 24 giờ - bạn sẽ có mọi thứ sẵn sàng trong 10 phút.",
        },
        {
          q: "Dữ liệu của tôi có an toàn không?",
          a: "Mã hóa cấp ngân hàng, sao lưu hàng ngày và trung tâm dữ liệu chứng nhận ISO 27001. Hồ sơ của bạn an toàn hơn giấy tờ hoặc Excel.",
        },
        {
          q: "Tôi có thể dùng thử trước khi mua?",
          a: "Có! Dùng thử miễn phí 14 ngày với đầy đủ tính năng. Không cần thẻ tín dụng. Đội ngũ của chúng tôi sẽ giúp bạn thiết lập lô hàng thử nghiệm để xem chính xác cách hoạt động.",
        },
      ],
    },
    // Dashboard Navigation
    dashboard: {
      nav: {
        overview: "Tổng quan",
        company: "Công ty",
        facilities: "Cơ sở",
        products: "Sản phẩm",
        lots: "Mã TLC",
        cte: "Sự kiện CTE",
        shipments: "Vận chuyển",
        reports: "Báo cáo",
        signOut: "Đăng xuất",
      },
      overview: {
        title: "Tổng quan hệ thống",
        subtitle: "Theo dõi truy xuất nguồn gốc thực phẩm theo thời gian thực",
        stats: {
          activeLots: "Lô hàng đang hoạt động",
          cteEvents: "Sự kiện CTE hôm nay",
          facilities: "Cơ sở hoạt động",
          compliance: "Tỷ lệ tuân thủ",
        },
        quickActions: {
          title: "Thao tác nhanh",
          createCTE: "Ghi nhận sự kiện CTE",
          createLot: "Tạo lô hàng mới",
          viewReports: "Xem báo cáo",
        },
        recentActivity: {
          title: "Hoạt động gần đây",
          empty: "Chưa có hoạt động nào",
          emptyDesc: "Bắt đầu theo dõi bằng cách tạo sự kiện CTE đầu tiên",
          createFirst: "Tạo sự kiện đầu tiên trong 30 giây",
        },
      },
    },
    // Company Management
    company: {
      title: "Hồ sơ công ty",
      create: "Tạo công ty",
      edit: "Chỉnh sửa công ty",
      save: "Lưu thay đổi",
      fields: {
        name: "Tên công ty",
        namePlaceholder: "Nhập tên công ty",
        taxId: "Mã số thuế / ĐKKD",
        taxIdPlaceholder: "Nhập mã số thuế",
        address: "Địa chỉ",
        addressPlaceholder: "Nhập địa chỉ đầy đủ",
        phone: "Số điện thoại",
        phonePlaceholder: "Nhập số điện thoại",
        email: "Email liên hệ",
        emailPlaceholder: "Nhập email",
        certifications: "Chứng nhận",
        certificationsPlaceholder: "FDA Registration, HACCP, v.v.",
      },
      info: {
        title: "Thông tin công ty",
        facilities: "Tổng số cơ sở",
        products: "Tổng số sản phẩm",
      },
    },
    // Facilities
    facilities: {
      title: "Quản lý cơ sở",
      create: "Thêm cơ sở mới",
      empty: "Chưa có cơ sở nào",
      emptyDesc: "Thêm cơ sở sản xuất hoặc kho lưu trữ đầu tiên",
      fields: {
        name: "Tên cơ sở",
        type: "Loại cơ sở",
        address: "Địa chỉ",
        phone: "Số điện thoại",
        manager: "Tên quản lý",
        status: "Trạng thái",
      },
      types: {
        farm: "Trang trại / Nơi thu hoạch",
        processing: "Nhà máy chế biến",
        warehouse: "Kho lạnh / Kho bảo quản",
        packing: "Cơ sở đóng gói",
        distribution: "Trung tâm phân phối",
      },
      status: {
        active: "Hoạt động",
        inactive: "Không hoạt động",
        maintenance: "Đang bảo trì",
      },
    },
    // Products
    products: {
      title: "Quản lý sản phẩm",
      create: "Thêm sản phẩm mới",
      empty: "Chưa có sản phẩm nào",
      emptyDesc: "Thêm sản phẩm đầu tiên để bắt đầu theo dõi",
      fields: {
        name: "Tên sản phẩm",
        namePlaceholder: "VD: Tôm sú tươi",
        nameEn: "Tên sản phẩm (Tiếng Anh)",
        nameEnPlaceholder: "Dùng cho báo cáo FDA",
        category: "Danh mục",
        scientificName: "Tên khoa học",
        scientificNamePlaceholder: "VD: Penaeus vannamei",
        onFtl: "Trong danh sách FTL",
        requiresCte: "Yêu cầu theo dõi CTE",
        description: "Mô tả",
      },
      categories: {
        seafood: "Hải sản",
        produce: "Nông sản tươi",
        dairy: "Sản phẩm sữa",
        meat: "Thịt & Gia cầm",
        nuts: "Hạt & Ngũ cốc",
        other: "Khác",
      },
      details: {
        title: "Chi tiết sản phẩm",
        recentLots: "Lô hàng gần đây",
        ftlBadge: "Thuộc FTL",
        cteBadge: "Yêu cầu CTE",
      },
    },
    // TLC Lots
    lots: {
      title: "Mã truy xuất nguồn gốc (TLC)",
      create: "Tạo lô hàng mới",
      empty: "Chưa có lô hàng nào",
      emptyDesc: "Tạo mã truy xuất nguồn gốc đầu tiên của bạn",
      fields: {
        lotCode: "Mã lô hàng",
        lotCodePlaceholder: "Tự động tạo hoặc tùy chỉnh",
        product: "Sản phẩm",
        quantity: "Số lượng",
        quantityPlaceholder: "VD: 1000",
        unit: "Đơn vị",
        productionDate: "Ngày sản xuất",
        expiryDate: "Ngày hết hạn",
        status: "Trạng thái",
        notes: "Ghi chú",
      },
      units: {
        kg: "Kilogram (kg)",
        lbs: "Pound (lbs)",
        boxes: "Thùng",
        pallets: "Pallet",
      },
      status: {
        active: "Đang hoạt động",
        shipped: "Đã vận chuyển",
        expired: "Đã hết hạn",
        recalled: "Đã thu hồi",
      },
      details: {
        title: "Chi tiết lô hàng",
        info: "Thông tin lô hàng",
        cteEvents: "Sự kiện CTE của lô hàng này",
      },
    },
    // CTE Events
    cte: {
      title: "Sự kiện theo dõi quan trọng (CTE)",
      create: "Ghi nhận CTE mới",
      empty: "Chưa có sự kiện CTE nào",
      emptyDesc: "Bắt đầu theo dõi bằng cách ghi nhận sự kiện quan trọng đầu tiên",
      fields: {
        eventType: "Loại sự kiện",
        lot: "Lô hàng truy xuất",
        facility: "Cơ sở / Địa điểm",
        eventDate: "Ngày giờ sự kiện",
        quantity: "Số lượng xử lý",
        temperature: "Nhiệt độ",
        temperaturePlaceholder: "VD: -18",
        notes: "Ghi chú / Quan sát",
      },
      types: {
        harvest: "Thu hoạch / Đánh bắt",
        cooling: "Làm lạnh ban đầu",
        packing: "Đóng gói",
        receiving: "Tiếp nhận",
        transformation: "Chuyển đổi / Chế biến",
        shipping: "Vận chuyển",
      },
      details: {
        title: "Chi tiết sự kiện CTE",
        info: "Thông tin sự kiện",
        kde: "Yếu tố dữ liệu chính (KDE)",
      },
    },
    // Shipments
    shipments: {
      title: "Theo dõi vận chuyển",
      create: "Tạo đơn vận chuyển mới",
      empty: "Chưa có đơn vận chuyển nào",
      emptyDesc: "Bắt đầu theo dõi lô hàng đầu tiên xuất sang Mỹ",
      fields: {
        shipmentCode: "Mã vận chuyển",
        lot: "Lô hàng truy xuất",
        destination: "Điểm đến",
        carrier: "Hãng vận chuyển",
        departureDate: "Ngày khởi hành",
        arrivalDate: "Ngày đến dự kiến",
        status: "Trạng thái",
        temperature: "Nhiệt độ vận chuyển",
        containerNumber: "Số container",
        sealNumber: "Số seal",
      },
      status: {
        preparing: "Đang chuẩn bị",
        inTransit: "Đang vận chuyển",
        arrived: "Đã đến",
        cleared: "Đã thông quan",
        delivered: "Đã giao hàng",
      },
    },
    // Reports
    reports: {
      title: "Báo cáo & Tuân thủ",
      create: "Tạo báo cáo kiểm toán",
      generate: "Tạo báo cáo FSMA",
      empty: "Chưa có báo cáo nào",
      emptyDesc: "Tạo báo cáo tuân thủ đầu tiên của bạn",
      fields: {
        title: "Tiêu đề báo cáo",
        type: "Loại báo cáo",
        dateRange: "Khoảng thời gian",
        findings: "Phát hiện",
        status: "Trạng thái tuân thủ",
        auditor: "Tên kiểm toán viên",
        notes: "Ghi chú",
      },
      types: {
        internal: "Kiểm toán nội bộ",
        external: "Kiểm toán bên ngoài",
        fda: "Thanh tra FDA",
        customer: "Kiểm toán khách hàng",
      },
      compliance: {
        compliant: "Tuân thủ",
        minor: "Vấn đề nhỏ",
        major: "Vấn đề lớn",
        critical: "Vấn đề nghiêm trọng",
      },
      templates: {
        title: "Mẫu báo cáo",
        fullTrace: "Báo cáo truy xuất đầy đủ",
        lotHistory: "Báo cáo lịch sử lô hàng",
        cteLog: "Nhật ký sự kiện CTE",
        facilityAudit: "Báo cáo kiểm toán cơ sở",
      },
    },
    // Common
    common: {
      actions: {
        save: "Lưu",
        cancel: "Hủy",
        delete: "Xóa",
        edit: "Chỉnh sửa",
        view: "Xem chi tiết",
        back: "Quay lại",
        search: "Tìm kiếm",
        filter: "Lọc",
        export: "Xuất file",
        print: "In",
        create: "Tạo mới",
        submit: "Gửi",
      },
      messages: {
        success: "Thao tác thành công",
        error: "Đã xảy ra lỗi",
        loading: "Đang tải...",
        noData: "Không có dữ liệu",
        selectOption: "Chọn một tùy chọn",
      },
      validation: {
        required: "Trường này bắt buộc",
        invalidEmail: "Email không hợp lệ",
        invalidPhone: "Số điện thoại không hợp lệ",
      },
    },
  },
}

export type Locale = keyof typeof translations
export const defaultLocale: Locale = "vi"
