-- Create initial admin account
-- Password: Admin@123456
-- IMPORTANT: Change this password after first login!

-- Note: This inserts into auth.users which requires Supabase Auth
-- For production, you should create the first admin via Supabase Dashboard
-- or use Supabase Management API

-- Insert admin user profile (assuming user was created via Supabase Auth)
-- You need to replace the UUID with actual user ID from auth.users after signup

-- Instructions:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create new user with email: admin@foodtrace.com and password: Admin@123456
-- 3. Copy the User UID
-- 4. Run this script replacing the UUID below

-- Example insert (you need to update the UUID):
-- INSERT INTO profiles (id, company_id, full_name, role, phone, language_preference)
-- VALUES 
--   ('REPLACE-WITH-ACTUAL-USER-UUID', NULL, 'System Administrator', 'admin', '+84-xxx-xxx-xxx', 'vi');

-- For first company admin, link to company:
-- UPDATE profiles SET company_id = '550e8400-e29b-41d4-a716-446655440000' 
-- WHERE id = 'REPLACE-WITH-ACTUAL-USER-UUID';
