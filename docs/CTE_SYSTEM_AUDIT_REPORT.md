# BÁO CÁO KIỂM TOÁN HỆ THỐNG CTE (Critical Tracking Events)
## FSMA 204 Traceability System - Food Safety Modernization Act

---

## I. VAI TRÒ KIỂM TOÁN VIÊN - CÁC CÂU HỎI THỰC TẾ

### A. Tính nhất quán dữ liệu (Data Integrity)

**Câu hỏi 1:** Nếu operator nhập sai loại CTE (ví dụ: "harvest" thay vì "cooling"), hệ thống có ngăn chặn được không?
- **Hiện trạng:** Có giới hạn qua `organization_type` permissions
- **Vấn đề:** Nếu `organization_type` NULL → cho phép tạo TẤT CẢ loại CTE (backward compatibility)
- **Rủi ro:** Packing house có thể tạo "harvest" event → dữ liệu không hợp lệ
- **Đánh giá:** ⚠️ CẦN CẢI THIỆN

**Câu hỏi 2:** Nếu operator tạo CTE cho TLC không thuộc công ty mình, có bị chặn không?
- **Hiện trạng:** RLS policy kiểm tra qua `tlc_id → product_id → company_id`
- **Vấn đề:** Chưa test kỹ logic cross-company
- **Đánh giá:** ✓ ĐÚNG (nhưng cần verify)

**Câu hỏi 3:** Nếu 2 operator cùng tạo CTE cho 1 TLC cùng lúc, có xung đột không?
- **Hiện trạng:** Database có transaction isolation
- **Vấn đề:** Không có optimistic locking
- **Rủi ro:** Race condition khi cập nhật inventory
- **Đánh giá:** ⚠️ CẦN LOCK MECHANISM

### B. Tính liên tục chuỗi cung ứng (Supply Chain Continuity)

**Câu hỏi 4:** Nếu distributor nhận hàng nhưng không có CTE "shipping" trước đó, hệ thống có cảnh báo?
- **Hiện trạng:** Trigger `validate_receiving_tlc_continuity` kiểm tra
- **Vấn đề:** Chỉ kiểm tra TLC tồn tại, KHÔNG kiểm tra có "shipping" CTE trước đó
- **Đánh giá:** ❌ THIẾU LOGIC

**Câu hỏi 5:** Nếu processor chế biến (transformation) 100kg nhưng chỉ nhận được 50kg, có cảnh báo không?
- **Hiện trạng:** Trigger `validate_transformation_balance` kiểm tra
- **Đánh giá:** ✓ ĐÚNG

**Câu hỏi 6:** Nếu TLC được ship đi 3 lần (splitting shipments), hệ thống tracking được không?
- **Hiện trạng:** Có `available_quantity`, `reserved_quantity`, `shipped_quantity` trong `traceability_lots`
- **Vấn đề:** Không có bảng `shipment_items` để track từng lần ship
- **Rủi ro:** Không theo dõi được partial shipments
- **Đánh giá:** ⚠️ CẦN BẢNG SHIPMENT_ITEMS

### C. Key Data Elements (KDE) - Tuân thủ FSMA 204

**Câu hỏi 7:** Nếu operator tạo CTE "cooling" nhưng thiếu nhiệt độ, hệ thống có chặn không?
- **Hiện trạng:** Trigger `auto_alert_missing_kde` tạo alert, KHÔNG chặn INSERT
- **Vấn đề:** Cho phép tạo CTE thiếu KDE
- **Đánh giá:** ⚠️ CHỈ CẢNH BÁO, KHÔNG CHẶN

**Câu hỏi 8:** KDE nào là bắt buộc cho từng loại CTE?
- **Hiện trạng:** Hard-coded trong trigger function:
  \`\`\`sql
  IF NEW.event_type IN ('harvest', 'packing', 'first_receiving') THEN
    v_required_kdes := ARRAY['harvest_date', 'harvest_location', 'grower_name'];
  END IF;
  \`\`\`
- **Vấn đề:** Không có bảng config, khó maintain
- **Đánh giá:** ⚠️ NÊN DÙNG CONFIG TABLE

**Câu hỏi 9:** Nếu FDA yêu cầu thêm KDE mới, có dễ cập nhật không?
- **Hiện trạng:** Phải sửa trigger function SQL
- **Đánh giá:** ❌ KHÓ MAINTAIN

### D. Truy xuất nguồn gốc (Traceability)

**Câu hỏi 10:** Nếu có recall, tìm BACKWARD từ TLC đến nguồn gốc có nhanh không?
- **Hiện trạng:** Có API `/api/trace/backward/[tlc]`
- **Đánh giá:** ✓ ĐÚNG

**Câu hỏi 11:** Nếu có recall, tìm FORWARD từ nguồn gốc đến tất cả TLC con có nhanh không?
- **Hiện trạng:** Có API `/api/trace/forward/[tlc]`
- **Vấn đề:** Query có thể chậm nếu nhiều level transformation
- **Đánh giá:** ⚠️ CẦN INDEX VÀ OPTIMIZATION

**Câu hỏi 12:** Nếu TLC được transform thành 3 TLC con khác nhau, tracking được không?
- **Hiện trạng:** Không có bảng `transformation_mapping` rõ ràng
- **Vấn đề:** Chỉ dựa vào CTE events, không có parent-child relationship
- **Đánh giá:** ❌ THIẾU TRANSFORMATION_MAPPING TABLE

### E. Audit Trail - Truy vết thay đổi

**Câu hỏi 13:** Nếu operator sửa CTE sau khi tạo, có log lại không?
- **Hiện trạng:** Có `updated_at` timestamp, KHÔNG có audit trail table
- **Vấn đề:** Không biết ai sửa, sửa gì, khi nào
- **Đánh giá:** ❌ THIẾU AUDIT_TRAIL TABLE

**Câu hỏi 14:** Nếu operator xóa CTE, có thể khôi phục không?
- **Hiện trạng:** Hard delete, không có soft delete
- **Đánh giá:** ❌ THIẾU SOFT DELETE

### F. Performance - Hiệu suất

**Câu hỏi 15:** Nếu công ty có 10,000 CTEs, trang list có load chậm không?
- **Hiện trạng:** Frontend pagination 50 items
- **Vấn đề:** Không có index optimization strategy
- **Đánh giá:** ⚠️ CẦN KIỂM TRA INDEXES

---

## II. PHÁT HIỆN CÁC LỖ HỔNG VÀ RỦI RO

### A. LỖ HỔNG BẢO MẬT (Security Vulnerabilities)

1. **RLS Policy quá rộng**
   - Policy "Operators can manage CTEs" cho phép ALL commands
   - Không kiểm tra role cụ thể, chỉ check company_id
   - **Rủi ro:** Operator có thể DELETE CTE của người khác trong cùng công ty

2. **Backward Compatibility gây rủi ro**
   - Nếu `organization_type` NULL → cho phép tạo mọi loại CTE
   - **Rủi ro:** User có thể bypass permissions

### B. LỖ HỔNG DỮ LIỆU (Data Integrity Issues)

1. **Thiếu validation chuỗi liên tục**
   - Không kiểm tra có "shipping" CTE trước khi "receiving"
   - **Rủi ro:** Dữ liệu không phản ánh thực tế

2. **Thiếu transformation mapping**
   - Không track parent-child TLC relationship rõ ràng
   - **Rủi ro:** Không trace được khi TLC split/merge

3. **KDE validation chỉ là warning**
   - Cho phép tạo CTE thiếu KDE bắt buộc
   - **Rủi ro:** Không tuân thủ FSMA 204

### C. LỖ HỔNG VẬN HÀNH (Operational Risks)

1. **Không có audit trail**
   - Không log changes, không biết ai sửa gì
   - **Rủi ro:** Không truy vết được khi có dispute

2. **Không có soft delete**
   - Data bị xóa vĩnh viễn
   - **Rủi ro:** Không khôi phục được

3. **KDE configuration hard-coded**
   - Phải sửa SQL trigger khi FDA thay đổi rule
   - **Rủi ro:** Khó maintain, dễ lỗi

---

## III. KHUYẾN NGHỊ CẢI THIỆN

### MỨC ĐỘ ƯU TIÊN CAO (CRITICAL)

1. **Bắt buộc organization_type**
   - Không cho phép NULL
   - Migration: set default based on company's primary activity

2. **Thêm transformation_mapping table**
   \`\`\`sql
   CREATE TABLE transformation_mappings (
     id UUID PRIMARY KEY,
     parent_tlc_id UUID REFERENCES traceability_lots(id),
     child_tlc_id UUID REFERENCES traceability_lots(id),
     transformation_cte_id UUID REFERENCES critical_tracking_events(id),
     ratio NUMERIC, -- e.g., 0.8 (80% yield)
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   \`\`\`

3. **Thêm KDE validation chặt chẽ**
   - Chuyển từ trigger cảnh báo sang constraint validation
   - Chặn INSERT nếu thiếu KDE bắt buộc

### MỨC ĐỘ ƯU TIÊN VỪA (IMPORTANT)

4. **Thêm audit_log table**
   \`\`\`sql
   CREATE TABLE audit_logs (
     id UUID PRIMARY KEY,
     table_name TEXT,
     record_id UUID,
     action TEXT, -- INSERT, UPDATE, DELETE
     old_values JSONB,
     new_values JSONB,
     changed_by UUID REFERENCES profiles(id),
     changed_at TIMESTAMPTZ DEFAULT NOW()
   );
   \`\`\`

5. **Implement soft delete**
   - Thêm `deleted_at TIMESTAMPTZ` column
   - Update RLS policies để filter deleted records

6. **Thêm validation chuỗi liên tục**
   - Kiểm tra có shipping CTE trước receiving
   - Kiểm tra chronological order

### MỨC ĐỘ ƯU TIÊN THẤP (NICE TO HAVE)

7. **Tạo KDE config table**
   \`\`\`sql
   CREATE TABLE kde_requirements (
     id UUID PRIMARY KEY,
     event_type TEXT,
     kde_name TEXT,
     is_required BOOLEAN,
     validation_rule TEXT -- JSON schema hoặc regex
   );
   \`\`\`

8. **Optimize indexes**
   \`\`\`sql
   CREATE INDEX idx_cte_tlc_date ON critical_tracking_events(tlc_id, event_date DESC);
   CREATE INDEX idx_cte_facility_type ON critical_tracking_events(facility_id, event_type);
   CREATE INDEX idx_cte_company_date ON critical_tracking_events(facility_id, created_at DESC)
     WHERE deleted_at IS NULL;
   \`\`\`

9. **Thêm version control cho CTEs**
   - Track edit history
   - Allow rollback

---

## IV. ĐÁNH GIÁ TỔNG QUAN

### Điểm mạnh ✓
1. Có trigger validation cơ bản (inventory, transformation balance)
2. Có RLS policies bảo vệ data theo company
3. Có KDE tracking qua `key_data_elements` table
4. Có backward/forward tracing APIs
5. Có auto-alert system cho missing KDEs

### Điểm yếu ⚠️
1. Thiếu transformation mapping rõ ràng
2. Thiếu audit trail và soft delete
3. KDE validation chỉ warning, không chặn
4. KDE config hard-coded trong SQL
5. Backward compatibility gây lỗ hổng permissions

### Điểm nguy hiểm ❌
1. Không validate chuỗi liên tục CTE (shipping → receiving)
2. Không track parent-child TLC relationships
3. Cho phép tạo CTE thiếu KDE bắt buộc

---

## V. LỘ TRÌNH TRIỂN KHAI

### Phase 1: Critical Fixes (1-2 tuần)
- [ ] Bắt buộc organization_type (migration script)
- [ ] Thêm transformation_mappings table
- [ ] Thêm validation chuỗi liên tục CTEs
- [ ] Chặn INSERT CTE nếu thiếu KDE bắt buộc

### Phase 2: Important Improvements (2-3 tuần)
- [ ] Implement audit_logs table với triggers
- [ ] Implement soft delete
- [ ] Optimize indexes
- [ ] Add integration tests cho traceability

### Phase 3: Nice to Have (1-2 tuần)
- [ ] Tạo KDE config table
- [ ] Version control cho CTEs
- [ ] Performance monitoring dashboard

---

## VI. KẾT LUẬN

Hệ thống CTE hiện tại có **nền tảng tốt** nhưng còn **nhiều lỗ hổng nghiêm trọng** ảnh hưởng đến:
1. **Tuân thủ FSMA 204:** Cho phép tạo CTE thiếu KDE → không đạt chuẩn
2. **Tính toàn vẹn dữ liệu:** Thiếu validation chuỗi liên tục
3. **Truy xuất nguồn gốc:** Thiếu transformation mapping → khó trace khi split/merge
4. **Audit compliance:** Không có audit trail → không đáp ứng yêu cầu kiểm toán

**Đánh giá tổng thể:** 6.5/10 - CẦN CẢI THIỆN NGAY

---

*Báo cáo được tạo bởi: AI Auditor*  
*Ngày: 25/12/2025*  
*Version: 1.0*
