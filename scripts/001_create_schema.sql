-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL, -- 'production', 'processing', 'storage', 'distribution'
  location_code TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  gps_coordinates TEXT,
  certification_status TEXT, -- 'certified', 'pending', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (Food Traceability List - FTL)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  product_name_vi TEXT,
  description TEXT,
  category TEXT NOT NULL, -- 'seafood', 'produce', 'dairy', etc.
  is_ftl BOOLEAN DEFAULT false, -- Is on Food Traceability List
  unit_of_measure TEXT NOT NULL,
  requires_cte BOOLEAN DEFAULT true, -- Requires Critical Tracking Events
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traceability Lot Codes (TLC) table
CREATE TABLE IF NOT EXISTS traceability_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tlc TEXT UNIQUE NOT NULL, -- Traceability Lot Code
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  production_date DATE NOT NULL,
  expiry_date DATE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'recalled', 'expired', 'depleted'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical Tracking Events (CTE) table
CREATE TABLE IF NOT EXISTS critical_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tlc_id UUID NOT NULL REFERENCES traceability_lots(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'harvest', 'cooling', 'packing', 'receiving', 'transformation', 'shipping'
  event_date TIMESTAMPTZ NOT NULL,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  responsible_person TEXT NOT NULL,
  description TEXT,
  temperature DECIMAL(5, 2), -- for cooling events
  quantity_processed DECIMAL(10, 2),
  unit TEXT,
  location_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Key Data Elements (KDE) table
CREATE TABLE IF NOT EXISTS key_data_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cte_id UUID NOT NULL REFERENCES critical_tracking_events(id) ON DELETE CASCADE,
  kde_type TEXT NOT NULL, -- 'supplier', 'origin', 'container', 'transport', 'temperature', etc.
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  unit TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_number TEXT UNIQUE NOT NULL,
  tlc_id UUID NOT NULL REFERENCES traceability_lots(id) ON DELETE CASCADE,
  from_facility_id UUID NOT NULL REFERENCES facilities(id),
  to_facility_id UUID REFERENCES facilities(id),
  destination_address TEXT NOT NULL,
  destination_company TEXT,
  shipment_date TIMESTAMPTZ NOT NULL,
  expected_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  carrier_name TEXT,
  vehicle_id TEXT,
  temperature_controlled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'in_transit', -- 'pending', 'in_transit', 'delivered', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Reports table
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT UNIQUE NOT NULL,
  report_type TEXT NOT NULL, -- 'internal', 'external', 'regulatory', 'compliance'
  facility_id UUID REFERENCES facilities(id),
  audit_date DATE NOT NULL,
  auditor_name TEXT NOT NULL,
  auditor_organization TEXT,
  findings TEXT,
  compliance_status TEXT, -- 'compliant', 'non_compliant', 'requires_action'
  corrective_actions TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin', 'manager', 'operator', 'viewer'
  phone TEXT,
  language_preference TEXT DEFAULT 'vi', -- 'vi' or 'en'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_data_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for companies (users can only see their own company)
CREATE POLICY "Users can view own company" ON companies FOR SELECT 
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update own company" ON companies FOR UPDATE 
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for facilities (users can only see facilities of their company)
CREATE POLICY "Users can view company facilities" ON facilities FOR SELECT 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers can insert facilities" ON facilities FOR INSERT 
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Managers can update facilities" ON facilities FOR UPDATE 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- RLS Policies for products
CREATE POLICY "Users can view company products" ON products FOR SELECT 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers can manage products" ON products FOR ALL 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- RLS Policies for traceability_lots
CREATE POLICY "Users can view company lots" ON traceability_lots FOR SELECT 
  USING (facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Operators can manage lots" ON traceability_lots FOR ALL 
  USING (facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'operator'))));

-- RLS Policies for critical_tracking_events
CREATE POLICY "Users can view company CTEs" ON critical_tracking_events FOR SELECT 
  USING (facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Operators can manage CTEs" ON critical_tracking_events FOR ALL 
  USING (facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'operator'))));

-- RLS Policies for key_data_elements
CREATE POLICY "Users can view company KDEs" ON key_data_elements FOR SELECT 
  USING (cte_id IN (SELECT id FROM critical_tracking_events WHERE facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))));

CREATE POLICY "Operators can manage KDEs" ON key_data_elements FOR ALL 
  USING (cte_id IN (SELECT id FROM critical_tracking_events WHERE facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'operator')))));

-- RLS Policies for shipments
CREATE POLICY "Users can view company shipments" ON shipments FOR SELECT 
  USING (from_facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Operators can manage shipments" ON shipments FOR ALL 
  USING (from_facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'operator'))));

-- RLS Policies for audit_reports
CREATE POLICY "Users can view company audits" ON audit_reports FOR SELECT 
  USING (facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Managers can manage audits" ON audit_reports FOR ALL 
  USING (facility_id IN (SELECT id FROM facilities WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))));

-- Create indexes for performance
CREATE INDEX idx_facilities_company ON facilities(company_id);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_traceability_lots_product ON traceability_lots(product_id);
CREATE INDEX idx_traceability_lots_facility ON traceability_lots(facility_id);
CREATE INDEX idx_cte_tlc ON critical_tracking_events(tlc_id);
CREATE INDEX idx_cte_facility ON critical_tracking_events(facility_id);
CREATE INDEX idx_kde_cte ON key_data_elements(cte_id);
CREATE INDEX idx_shipments_tlc ON shipments(tlc_id);
CREATE INDEX idx_profiles_company ON profiles(company_id);
