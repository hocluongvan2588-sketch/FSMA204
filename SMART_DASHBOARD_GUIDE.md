# Smart Traceability Dashboard - Hướng dẫn sử dụng

## Tổng quan

Smart Traceability Dashboard được thiết kế để hỗ trợ người dùng tuân thủ FSMA 204 một cách dễ dàng mà không cần đào tạo chuyên sâu.

## Các tính năng chính

### 1. Interactive Onboarding Tour
- **Mục đích**: Dẫn dắt người dùng mới qua 3 bước cốt lõi
- **Cách sử dụng**: Nhấn nút "Hướng dẫn sử dụng" ở góc phải trên dashboard
- **Các bước**:
  1. **Gán mã TLC**: Học cách tạo Traceability Lot Code
  2. **Quota Tracking**: Hiểu về hạn mức sự kiện hàng tháng
  3. **Compliance Check**: Kiểm tra trạng thái tuân thủ KDE

### 2. Quota Tracker (Theo dõi hạn mức)
- **Real-time tracking**: Tự động tính toán số lượng CTE events đã tạo trong tháng
- **Warning levels**:
  - 🟢 **Safe** (0-74%): Hạn mức ổn định
  - 🟡 **Warning** (75-89%): Hạn mức sắp đầy, cân nhắc nâng cấp
  - 🔴 **Critical** (90-100%): Sắp hết hạn mức, cần nâng cấp ngay
- **Refresh**: Tự động làm mới mỗi 5 phút

### 3. Compliance Dashboard
- **Overall Score**: Điểm tuân thủ tổng thể (0-100%)
- **KDE Validation**: Kiểm tra Key Data Elements còn thiếu
- **Status Levels**:
  - ✅ **Tốt** (90-100%): Tuân thủ đầy đủ
  - ⚠️ **Cần cải thiện** (70-89%): Có một số thiếu sót
  - ❌ **Không đạt** (<70%): Cần khắc phục ngay

### 4. Adaptive Dashboard
Dashboard tự động điều chỉnh widgets dựa trên loại tổ chức:

#### Initial Packer (Đóng gói ban đầu)
- Widget "Mã TLC đã gán": Số lượng mã đã dán lên sản phẩm
- Widget "Trạng thái kho lạnh": Giám sát nhiệt độ

#### Distributor (Nhà phân phối)
- Widget "Lịch trình Container": Theo dõi các chuyến hàng
- Widget "Mã chì (Seal)": Quản lý seal codes

#### Processor (Nhà chế biến)
- Widget "Lô đã chế biến": Số lượng batches đã xử lý
- Widget "Mức tồn kho": Capacity tracking

### 5. Priority Notification Center
- **3 levels priority**:
  - 🔴 **Critical**: Cần xử lý trong 7 ngày
  - 🟡 **High**: Cần xử lý trong 30 ngày
  - 🔵 **Medium**: Thông tin chung
- **Categories**:
  - Compliance (Tuân thủ)
  - Expiry (Hết hạn)
  - Quota (Hạn mức)
  - System (Hệ thống)

### 6. Smart Menu Highlighting
- Menu tự động highlight các mục quan trọng trong tour
- Hiệu ứng pulse khi đang trong chế độ hướng dẫn
- Icon lightning ⚡ cho items được highlight

## Workflow khuyến nghị

### Người vận hành (Operator)
1. Kiểm tra "Công việc hôm nay"
2. Tạo CTE events cho các hoạt động
3. Cập nhật trạng thái vận chuyển
4. Xem thông báo ưu tiên

### Người quản lý (Manager)
1. Xem overview dashboard
2. Kiểm tra compliance score
3. Review quota usage
4. Phê duyệt các cảnh báo
5. Xem báo cáo performance

### Admin
1. Monitor overall compliance
2. Quản lý facilities và products
3. Xem audit trail
4. Điều chỉnh subscription

## Best Practices

1. **Daily Check**: Kiểm tra dashboard mỗi ngày
2. **Act on Critical**: Xử lý thông báo Critical ngay lập tức
3. **Monitor Quota**: Theo dõi quota khi đạt 75%
4. **Complete KDEs**: Đảm bảo nhập đầy đủ Key Data Elements
5. **Regular Training**: Xem lại tour hướng dẫn định kỳ

## Troubleshooting

### Quota đạt 90%
- Kiểm tra gói dịch vụ hiện tại
- Liên hệ support để nâng cấp
- Tối ưu hóa số lượng CTE events

### Compliance score thấp
- Xem chi tiết KDE còn thiếu
- Bổ sung thông tin cho các CTE
- Sử dụng bulk edit để cập nhật hàng loạt

### Tour không hiển thị
- Clear browser cache
- Kiểm tra localStorage
- Reset tour trong Settings

## Liên hệ hỗ trợ

Email: support@fsma-tracker.com
Hotline: 1900-xxxx
</markdown>
