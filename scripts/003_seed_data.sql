-- Seed initial data for testing

-- Insert sample company
INSERT INTO companies (id, name, registration_number, address, phone, email, contact_person)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Công ty TNHH Thủy sản Việt Nam', 'MST-0123456789', '123 Đường Nguyễn Văn Cừ, Quận 5, TP.HCM', '+84 28 1234 5678', 'contact@thuysan.vn', 'Nguyễn Văn A');

-- Insert sample facilities
INSERT INTO facilities (id, company_id, name, facility_type, location_code, address, certification_status)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Cơ sở chế biến số 1', 'processing', 'FAC-001', '456 Đường Lê Văn Việt, TP. Thủ Đức, TP.HCM', 'certified'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Kho lạnh trung tâm', 'storage', 'FAC-002', '789 Đường Võ Văn Kiệt, Quận 1, TP.HCM', 'certified');

-- Insert sample products (FTL items)
INSERT INTO products (id, company_id, product_code, product_name, product_name_vi, category, is_ftl, unit_of_measure, requires_cte)
VALUES 
  ('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'PRD-SHRIMP-001', 'Fresh Shrimp', 'Tôm tươi', 'seafood', true, 'kg', true),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'PRD-FISH-001', 'Fresh Tuna', 'Cá ngừ tươi', 'seafood', true, 'kg', true);
