-- =====================================================
-- FOODTRACE FSMA 204 - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This file contains the COMPLETE database schema including:
-- - 36 tables with all columns, constraints, and relationships
-- - All helper functions and trigger functions
-- - All triggers for automation
-- - All RLS policies for security
-- - Initial seed data
--
-- Run this file on a fresh PostgreSQL database (with auth schema)
-- to recreate the entire system.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SECTION 1: CREATE ALL TABLES
-- =====================================================

-- 1. Companies (root table)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  stripe_customer_id TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (user accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  phone TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  location_code TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  gps_coordinates TEXT,
  certification_status TEXT,
  agent_registration_date DATE,
  agent_registration_years INTEGER DEFAULT 1,
  agent_expiry_date DATE,
  duns_number TEXT,
  fda_facility_number TEXT,
  fda_registration_date DATE,
  fda_expiry_date DATE,
  fda_status TEXT DEFAULT 'pending',
  fda_registration_status TEXT DEFAULT 'pending',
  registration_email TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE facilities IS 'Production facilities with FDA registration and US Agent information';

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  product_name_vi TEXT,
  description TEXT,
  category TEXT NOT NULL,
  is_ftl BOOLEAN DEFAULT false,
  unit_of_measure TEXT NOT NULL,
  requires_cte BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Traceability Lots (TLC)
CREATE TABLE IF NOT EXISTS traceability_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tlc TEXT UNIQUE NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  production_date DATE NOT NULL,
  expiry_date DATE,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  available_quantity NUMERIC,
  reserved_quantity NUMERIC DEFAULT 0,
  shipped_quantity NUMERIC DEFAULT 0,
  parent_tlc_count INTEGER DEFAULT 0,
  child_tlc_count INTEGER DEFAULT 0,
  is_transformed_product BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID,
  archive_reason TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Critical Tracking Events (CTE)
CREATE TABLE IF NOT EXISTS critical_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tlc_id UUID NOT NULL REFERENCES traceability_lots(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  quantity_processed NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  location TEXT,
  operator_name TEXT,
  temperature NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Key Data Elements (KDE)
CREATE TABLE IF NOT EXISTS key_data_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cte_id UUID NOT NULL REFERENCES critical_tracking_events(id) ON DELETE CASCADE,
  kde_code TEXT NOT NULL,
  kde_name TEXT NOT NULL,
  kde_value TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. KDE Requirements
CREATE TABLE IF NOT EXISTS kde_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  kde_code TEXT NOT NULL,
  kde_name TEXT NOT NULL,
  kde_description TEXT,
  is_required BOOLEAN DEFAULT true,
  data_type TEXT DEFAULT 'text',
  validation_rules JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_type, kde_code)
);

-- 9. Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_number TEXT UNIQUE NOT NULL,
  from_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  to_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  departure_date DATE,
  arrival_date DATE,
  carrier_name TEXT,
  tracking_number TEXT,
  status TEXT DEFAULT 'preparing',
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Shipment Items
CREATE TABLE IF NOT EXISTS shipment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  tlc_id UUID NOT NULL REFERENCES traceability_lots(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Transformation Events
CREATE TABLE IF NOT EXISTS transformation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  output_tlc_id UUID NOT NULL REFERENCES traceability_lots(id) ON DELETE CASCADE,
  transformation_type TEXT NOT NULL,
  transformation_date TIMESTAMPTZ NOT NULL,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  operator_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Transformation Inputs
CREATE TABLE IF NOT EXISTS transformation_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transformation_id UUID NOT NULL REFERENCES transformation_events(id) ON DELETE CASCADE,
  input_tlc_id UUID NOT NULL REFERENCES traceability_lots(id) ON DELETE CASCADE,
  quantity_used NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_columns TEXT[],
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Chronological Order Validations
CREATE TABLE IF NOT EXISTS chronological_order_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tlc_id UUID NOT NULL REFERENCES traceability_lots(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  previous_event_type TEXT,
  previous_event_date TIMESTAMPTZ,
  is_valid BOOLEAN NOT NULL,
  validation_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. US Agents
CREATE TABLE IF NOT EXISTS us_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_address TEXT NOT NULL,
  agent_phone TEXT NOT NULL,
  agent_email TEXT NOT NULL,
  agent_registration_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. FDA Registrations
CREATE TABLE IF NOT EXISTS fda_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  registration_number TEXT UNIQUE NOT NULL,
  registration_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  renewal_reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Audit Reports
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  audit_date DATE NOT NULL,
  auditor_name TEXT NOT NULL,
  audit_type TEXT NOT NULL,
  findings TEXT,
  recommendations TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Exporter Facilities
CREATE TABLE IF NOT EXISTS exporter_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  facility_name TEXT NOT NULL,
  facility_address TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  certification_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Service Packages
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL,
  price_yearly NUMERIC NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Company Subscriptions
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  billing_cycle TEXT NOT NULL,
  price_paid NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT true,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES company_subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  transaction_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Subscription Audit Logs
CREATE TABLE IF NOT EXISTS subscription_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES company_subscriptions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Company Subscription Overrides
CREATE TABLE IF NOT EXISTS company_subscription_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL,
  override_value JSONB NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Subscription Override Audit Logs
CREATE TABLE IF NOT EXISTS subscription_override_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  override_id UUID REFERENCES company_subscription_overrides(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. File Uploads
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  related_table TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Inventory Balance Logs
CREATE TABLE IF NOT EXISTS inventory_balance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tlc_id UUID NOT NULL REFERENCES traceability_lots(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  quantity_change NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Facility Update Requests
CREATE TABLE IF NOT EXISTS facility_update_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  current_values JSONB,
  requested_values JSONB NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_table TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 32. Data Export Logs
CREATE TABLE IF NOT EXISTS data_export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  filters JSONB,
  status TEXT DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 33. Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL,
  template_config JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL,
  schedule_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 35. Alert Rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 36. Alert Logs
CREATE TABLE IF NOT EXISTS alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_data JSONB,
  actions_taken JSONB,
  status TEXT DEFAULT 'sent',
  error_message TEXT
);

-- =====================================================
-- SECTION 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_facilities_company ON facilities(company_id);
CREATE INDEX IF NOT EXISTS idx_facilities_location_code ON facilities(location_code);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_tlc_product ON traceability_lots(product_id);
CREATE INDEX IF NOT EXISTS idx_tlc_facility ON traceability_lots(facility_id);
CREATE INDEX IF NOT EXISTS idx_tlc_tlc ON traceability_lots(tlc);
CREATE INDEX IF NOT EXISTS idx_tlc_status ON traceability_lots(status);
CREATE INDEX IF NOT EXISTS idx_cte_tlc ON critical_tracking_events(tlc_id);
CREATE INDEX IF NOT EXISTS idx_cte_facility ON critical_tracking_events(facility_id);
CREATE INDEX IF NOT EXISTS idx_cte_event_type ON critical_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cte_event_date ON critical_tracking_events(event_date);
CREATE INDEX IF NOT EXISTS idx_kde_cte ON key_data_elements(cte_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- =====================================================
-- SECTION 3: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function: Get user's company ID
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1);
END;
$$;

-- Function: Get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1);
END;
$$;

-- =====================================================
-- SECTION 4: CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Trigger Function: Auto-populate KDEs based on event type
CREATE OR REPLACE FUNCTION auto_populate_kdes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert required KDEs for this event type
  INSERT INTO key_data_elements (cte_id, kde_code, kde_name, kde_value, is_required)
  SELECT 
    NEW.id,
    kr.kde_code,
    kr.kde_name,
    '', -- Empty value to be filled by user
    kr.is_required
  FROM kde_requirements kr
  WHERE kr.event_type = NEW.event_type;
  
  RETURN NEW;
END;
$$;

-- Trigger Function: Handle inventory on receiving event
CREATE OR REPLACE FUNCTION handle_receiving_event_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_added_quantity NUMERIC;
BEGIN
  -- Only process receiving events
  IF NEW.event_type = 'receiving' THEN
    v_added_quantity := NEW.quantity_processed;
    
    -- Update available_quantity in traceability_lots
    UPDATE traceability_lots
    SET 
      available_quantity = COALESCE(available_quantity, 0) + v_added_quantity,
      updated_at = NOW()
    WHERE id = NEW.tlc_id;
    
    -- Log the inventory change
    INSERT INTO inventory_balance_logs (
      company_id,
      tlc_id,
      event_type,
      quantity_change,
      balance_before,
      balance_after,
      reference_id,
      reference_type,
      notes
    )
    SELECT 
      (SELECT company_id FROM facilities WHERE id = NEW.facility_id),
      NEW.tlc_id,
      'receiving',
      v_added_quantity,
      COALESCE(tl.available_quantity, 0) - v_added_quantity,
      COALESCE(tl.available_quantity, 0),
      NEW.id,
      'critical_tracking_event',
      'Inventory added from receiving event'
    FROM traceability_lots tl
    WHERE tl.id = NEW.tlc_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger Function: Handle inventory deduction on CTE events
CREATE OR REPLACE FUNCTION handle_cte_inventory_deduction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deducted_quantity NUMERIC;
BEGIN
  -- Only process events that consume inventory
  IF NEW.event_type IN ('cooling', 'packing', 'shipping') THEN
    v_deducted_quantity := NEW.quantity_processed;
    
    -- Update available_quantity in traceability_lots
    UPDATE traceability_lots
    SET 
      available_quantity = COALESCE(available_quantity, 0) - v_deducted_quantity,
      updated_at = NOW()
    WHERE id = NEW.tlc_id;
    
    -- Log the inventory change
    INSERT INTO inventory_balance_logs (
      company_id,
      tlc_id,
      event_type,
      quantity_change,
      balance_before,
      balance_after,
      reference_id,
      reference_type,
      notes
    )
    SELECT 
      (SELECT company_id FROM facilities WHERE id = NEW.facility_id),
      NEW.tlc_id,
      NEW.event_type,
      -v_deducted_quantity,
      COALESCE(tl.available_quantity, 0) + v_deducted_quantity,
      COALESCE(tl.available_quantity, 0),
      NEW.id,
      'critical_tracking_event',
      FORMAT('Inventory deducted from %s event', NEW.event_type)
    FROM traceability_lots tl
    WHERE tl.id = NEW.tlc_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger Function: Validate chronological order
CREATE OR REPLACE FUNCTION validate_chronological_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_previous_event RECORD;
  v_is_valid BOOLEAN;
  v_message TEXT;
BEGIN
  -- Get the most recent event for this TLC
  SELECT event_type, event_date INTO v_previous_event
  FROM critical_tracking_events
  WHERE tlc_id = NEW.tlc_id
    AND id != NEW.id
  ORDER BY event_date DESC
  LIMIT 1;
  
  -- Validate chronological order
  IF v_previous_event IS NOT NULL AND NEW.event_date < v_previous_event.event_date THEN
    v_is_valid := false;
    v_message := FORMAT('Event date %s is before previous event %s on %s', 
                       NEW.event_date, v_previous_event.event_type, v_previous_event.event_date);
  ELSE
    v_is_valid := true;
    v_message := 'Event is in chronological order';
  END IF;
  
  -- Log validation result
  INSERT INTO chronological_order_validations (
    tlc_id, event_type, event_date, 
    previous_event_type, previous_event_date,
    is_valid, validation_message
  ) VALUES (
    NEW.tlc_id, NEW.event_type, NEW.event_date,
    v_previous_event.event_type, v_previous_event.event_date,
    v_is_valid, v_message
  );
  
  RETURN NEW;
END;
$$;

-- Trigger Function: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- SECTION 5: CREATE TRIGGERS
-- =====================================================

-- Trigger: Auto-populate KDEs when CTE is created
CREATE TRIGGER trigger_auto_populate_kdes
  AFTER INSERT ON critical_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_kdes();

-- Trigger: Handle inventory on receiving
CREATE TRIGGER trigger_handle_receiving_inventory
  AFTER INSERT ON critical_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_receiving_event_inventory();

-- Trigger: Handle inventory deduction on CTE events
CREATE TRIGGER trigger_handle_cte_inventory_deduction
  AFTER INSERT ON critical_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_cte_inventory_deduction();

-- Trigger: Validate chronological order
CREATE TRIGGER trigger_validate_chronological_order
  BEFORE INSERT OR UPDATE ON critical_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION validate_chronological_order();

-- Trigger: Update timestamps on companies
CREATE TRIGGER trigger_update_companies_timestamp
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Update timestamps on profiles
CREATE TRIGGER trigger_update_profiles_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Update timestamps on facilities
CREATE TRIGGER trigger_update_facilities_timestamp
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Update timestamps on products
CREATE TRIGGER trigger_update_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Update timestamps on traceability_lots
CREATE TRIGGER trigger_update_tlc_timestamp
  BEFORE UPDATE ON traceability_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SECTION 6: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_data_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kde_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronological_order_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE us_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fda_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE exporter_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscription_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_override_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_update_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 7: CREATE RLS POLICIES
-- =====================================================

-- Companies: Users can only see their own company
CREATE POLICY companies_select_own ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY companies_update_admin ON companies
  FOR UPDATE USING (
    id = get_user_company_id() AND 
    get_user_role() IN ('admin', 'system_admin')
  );

-- Profiles: Users can see profiles in their company
CREATE POLICY profiles_select_company ON profiles
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY profiles_update_self ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE USING (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('admin', 'system_admin')
  );

-- Facilities: Users can see facilities in their company
CREATE POLICY facilities_select_company ON facilities
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY facilities_all_admin ON facilities
  FOR ALL USING (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('admin', 'manager', 'system_admin')
  );

-- Products: Users can see products in their company
CREATE POLICY products_select_company ON products
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY products_all_admin ON products
  FOR ALL USING (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('admin', 'manager', 'system_admin')
  );

-- Traceability Lots: Users can see TLCs in their company
CREATE POLICY tlc_select_company ON traceability_lots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM facilities f 
      WHERE f.id = traceability_lots.facility_id 
      AND f.company_id = get_user_company_id()
    )
  );

CREATE POLICY tlc_all_operator ON traceability_lots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM facilities f 
      WHERE f.id = traceability_lots.facility_id 
      AND f.company_id = get_user_company_id()
    )
  );

-- Critical Tracking Events: Users can see CTEs in their company
CREATE POLICY cte_select_company ON critical_tracking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM facilities f 
      WHERE f.id = critical_tracking_events.facility_id 
      AND f.company_id = get_user_company_id()
    )
  );

CREATE POLICY cte_all_operator ON critical_tracking_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM facilities f 
      WHERE f.id = critical_tracking_events.facility_id 
      AND f.company_id = get_user_company_id()
    )
  );

-- KDE Requirements: Public read access
CREATE POLICY kde_requirements_select_all ON kde_requirements
  FOR SELECT USING (true);

-- Notifications: Users can only see their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System Settings: Public settings visible to all
CREATE POLICY system_settings_select_public ON system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY system_settings_all_admin ON system_settings
  FOR ALL USING (get_user_role() = 'system_admin');

-- =====================================================
-- SECTION 8: INSERT INITIAL DATA
-- =====================================================

-- Insert KDE Requirements for different event types
INSERT INTO kde_requirements (event_type, kde_code, kde_name, kde_description, is_required, data_type, display_order)
VALUES
  ('receiving', 'RCV-001', 'Supplier Name', 'Name of the supplier providing the food', true, 'text', 1),
  ('receiving', 'RCV-002', 'Supplier Location', 'Location/address of supplier', true, 'text', 2),
  ('receiving', 'RCV-003', 'Harvest Date', 'Date when the food was harvested', false, 'date', 3),
  ('receiving', 'RCV-004', 'Temperature', 'Temperature at receiving', false, 'number', 4),
  
  ('cooling', 'COL-001', 'Initial Temperature', 'Temperature before cooling', true, 'number', 1),
  ('cooling', 'COL-002', 'Final Temperature', 'Temperature after cooling', true, 'number', 2),
  ('cooling', 'COL-003', 'Cooling Duration', 'Duration of cooling process', false, 'text', 3),
  
  ('packing', 'PCK-001', 'Package Type', 'Type of packaging used', true, 'text', 1),
  ('packing', 'PCK-002', 'Package Count', 'Number of packages', true, 'number', 2),
  ('packing', 'PCK-003', 'Net Weight', 'Net weight per package', false, 'number', 3),
  
  ('shipping', 'SHP-001', 'Destination', 'Shipping destination', true, 'text', 1),
  ('shipping', 'SHP-002', 'Carrier Name', 'Name of shipping carrier', true, 'text', 2),
  ('shipping', 'SHP-003', 'Tracking Number', 'Shipment tracking number', false, 'text', 3),
  ('shipping', 'SHP-004', 'Container Number', 'Container/vehicle number', false, 'text', 4)
ON CONFLICT (event_type, kde_code) DO NOTHING;

-- Insert Service Packages
INSERT INTO service_packages (name, description, price_monthly, price_yearly, features, limits, display_order)
VALUES
  ('Free', 'Basic features for small businesses', 0, 0, 
   '["Basic traceability", "Up to 50 TLCs", "1 facility"]'::jsonb,
   '{"max_tlcs": 50, "max_facilities": 1, "max_users": 2}'::jsonb, 1),
  
  ('Professional', 'Advanced features for growing businesses', 99, 999,
   '["Full traceability", "Unlimited TLCs", "5 facilities", "Priority support"]'::jsonb,
   '{"max_tlcs": -1, "max_facilities": 5, "max_users": 10}'::jsonb, 2),
  
  ('Enterprise', 'Complete solution for large organizations', 299, 2999,
   '["All features", "Unlimited everything", "Dedicated support", "Custom integrations"]'::jsonb,
   '{"max_tlcs": -1, "max_facilities": -1, "max_users": -1}'::jsonb, 3)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table counts
SELECT 
  'Tables created' as status,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Verify RLS enabled
SELECT 
  'RLS enabled' as status,
  COUNT(*) as rls_count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

-- Verify initial data
SELECT 'KDE Requirements' as table_name, COUNT(*) as row_count FROM kde_requirements
UNION ALL
SELECT 'Service Packages', COUNT(*) FROM service_packages;

-- =====================================================
-- END OF MASTER DATABASE SCHEMA
-- =====================================================
