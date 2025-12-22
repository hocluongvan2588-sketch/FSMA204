-- FDA Facility Registration Management Table
CREATE TABLE IF NOT EXISTS fda_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  fda_registration_number TEXT UNIQUE,
  registration_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'expired', 'cancelled'
  registration_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  
  -- FDA Required Information
  fei_number TEXT, -- Food Facility Establishment Identifier
  duns_number TEXT, -- Data Universal Numbering System
  facility_type_fda TEXT[], -- Array of FDA facility types
  food_product_categories TEXT[], -- Types of food products handled
  
  -- Contact Information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  
  -- Additional Info
  notes TEXT,
  last_inspection_date DATE,
  next_inspection_date DATE,
  
  -- Notifications
  notification_enabled BOOLEAN DEFAULT true,
  notification_days_before INT DEFAULT 30, -- Send reminder N days before expiry
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- US Agent Management Table
CREATE TABLE IF NOT EXISTS us_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Agent Information
  agent_name TEXT NOT NULL,
  agent_company_name TEXT,
  agent_type TEXT NOT NULL, -- 'individual', 'company', 'law_firm'
  
  -- Contact Details
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  fax TEXT,
  
  -- Address
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  
  -- Service Details
  service_start_date DATE NOT NULL,
  service_end_date DATE,
  contract_status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  
  -- Notifications
  notification_enabled BOOLEAN DEFAULT true,
  notification_days_before INT DEFAULT 60, -- Send reminder before contract expiry
  
  -- Documents
  contract_document_url TEXT,
  authorization_letter_url TEXT,
  
  notes TEXT,
  is_primary BOOLEAN DEFAULT false, -- Mark as primary agent
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Packages Table (for business model)
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Package Information
  package_name TEXT NOT NULL,
  package_name_vi TEXT NOT NULL,
  package_code TEXT UNIQUE NOT NULL,
  description TEXT,
  description_vi TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  price_currency TEXT DEFAULT 'USD',
  
  -- Package Features
  max_users INT,
  max_facilities INT,
  max_products INT,
  max_storage_gb DECIMAL(10, 2),
  
  -- Feature Flags
  includes_fda_management BOOLEAN DEFAULT false,
  includes_agent_management BOOLEAN DEFAULT false,
  includes_cte_tracking BOOLEAN DEFAULT true,
  includes_reporting BOOLEAN DEFAULT true,
  includes_api_access BOOLEAN DEFAULT false,
  includes_custom_branding BOOLEAN DEFAULT false,
  includes_priority_support BOOLEAN DEFAULT false,
  
  -- Package Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Subscriptions Table
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE RESTRICT,
  
  -- Subscription Details
  subscription_status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'cancelled', 'expired'
  billing_cycle TEXT NOT NULL, -- 'monthly', 'yearly'
  
  -- Dates
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  trial_end_date DATE,
  next_billing_date DATE,
  cancelled_at TIMESTAMPTZ,
  
  -- Pricing
  current_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Payment
  payment_method TEXT, -- 'credit_card', 'bank_transfer', 'invoice'
  last_payment_date DATE,
  last_payment_amount DECIMAL(10, 2),
  
  -- Usage Tracking
  current_users_count INT DEFAULT 0,
  current_facilities_count INT DEFAULT 0,
  current_products_count INT DEFAULT 0,
  current_storage_gb DECIMAL(10, 2) DEFAULT 0,
  
  -- Notifications
  notification_enabled BOOLEAN DEFAULT true,
  notification_days_before INT DEFAULT 7,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FDA Notification Queue Table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL, -- 'fda_expiry', 'agent_expiry', 'subscription_expiry', 'inspection_due'
  reference_id UUID NOT NULL, -- ID of the related record
  reference_table TEXT NOT NULL, -- Table name ('fda_registrations', 'us_agents', 'company_subscriptions')
  
  -- Notification Details
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE fda_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE us_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fda_registrations
CREATE POLICY "Users can view company FDA registrations" ON fda_registrations FOR SELECT 
  USING (facility_id IN (
    SELECT id FROM facilities WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Managers can manage FDA registrations" ON fda_registrations FOR ALL 
  USING (facility_id IN (
    SELECT id FROM facilities WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'system_admin')
    )
  ));

-- RLS Policies for us_agents
CREATE POLICY "Users can view company agents" ON us_agents FOR SELECT 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage agents" ON us_agents FOR ALL 
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
  ));

-- RLS Policies for service_packages (public read, admin write)
CREATE POLICY "Anyone can view active packages" ON service_packages FOR SELECT 
  USING (is_active = true OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'system_admin'));

CREATE POLICY "System admins can manage packages" ON service_packages FOR ALL 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'system_admin'));

-- RLS Policies for company_subscriptions
CREATE POLICY "Users can view own company subscription" ON company_subscriptions FOR SELECT 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System admins can manage all subscriptions" ON company_subscriptions FOR ALL 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'system_admin'));

CREATE POLICY "Admins can view own company subscription" ON company_subscriptions FOR SELECT 
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for notification_queue
CREATE POLICY "System admins can manage notifications" ON notification_queue FOR ALL 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'system_admin'));

-- Create indexes for performance
CREATE INDEX idx_fda_registrations_facility ON fda_registrations(facility_id);
CREATE INDEX idx_fda_registrations_expiry ON fda_registrations(expiry_date);
CREATE INDEX idx_us_agents_company ON us_agents(company_id);
CREATE INDEX idx_us_agents_contract_end ON us_agents(service_end_date);
CREATE INDEX idx_company_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_status ON company_subscriptions(subscription_status);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for, status);

-- Insert default service packages
INSERT INTO service_packages (
  package_name, package_name_vi, package_code,
  description, description_vi,
  price_monthly, price_yearly,
  max_users, max_facilities, max_products, max_storage_gb,
  includes_fda_management, includes_agent_management,
  includes_cte_tracking, includes_reporting,
  is_active, is_featured, sort_order
) VALUES 
(
  'Starter', 'Gói Khởi Đầu', 'STARTER',
  'Perfect for small businesses starting with food traceability',
  'Phù hợp cho doanh nghiệp nhỏ bắt đầu với truy xuất nguồn gốc thực phẩm',
  29.00, 290.00,
  3, 1, 50, 5,
  false, false,
  true, true,
  true, false, 1
),
(
  'Professional', 'Gói Chuyên Nghiệp', 'PROFESSIONAL',
  'For growing businesses with FDA compliance needs',
  'Dành cho doanh nghiệp phát triển với nhu cầu tuân thủ FDA',
  99.00, 990.00,
  10, 3, 200, 20,
  true, true,
  true, true,
  true, false, 2
),
(
  'Enterprise', 'Gói Doanh Nghiệp', 'ENTERPRISE',
  'Complete solution for large organizations',
  'Giải pháp hoàn chỉnh cho tổ chức lớn',
  299.00, 2990.00,
  -1, -1, -1, 100, -- -1 means unlimited
  true, true,
  true, true,
  true, true, 3
);
