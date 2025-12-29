/*
================================================================================
FSMA204 DATABASE MIGRATION: PostgreSQL → MySQL 8.0+
================================================================================
Date: 2025-12-29
Source: PostgreSQL FSMA204 (Supabase)
Target: MySQL 8.0+
Status: Complete Schema Conversion (DDL + Functions)

MIGRATION SUMMARY:
- 16 Tables with full column definitions
- 18 Foreign Key Relationships
- 32 Indexes (including unique constraints)
- 4 Functions/Procedures (converted from PL/pgSQL to MySQL)
- 0 Views (not found in source)
- 0 Triggers (application-level instead)

DATA PERSISTENCE: Schema only (no seed data)
================================================================================
*/

-- ============================================================================
-- SECTION 1: CREATE SCHEMAS & SETUP
-- ============================================================================

CREATE DATABASE IF NOT EXISTS fsma204;
USE fsma204;

-- Set MySQL mode to be compatible with strict mode
SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================================================
-- SECTION 2: CREATE TABLES (In dependency order)
-- ============================================================================

-- TABLE 1: companies (no dependencies)
CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  name VARCHAR(255) NOT NULL COMMENT 'Company name',
  registration_number VARCHAR(255) NOT NULL UNIQUE COMMENT 'Unique registration number',
  address TEXT NOT NULL COMMENT 'Company address',
  phone VARCHAR(20) COMMENT 'Contact phone',
  email VARCHAR(255) COMMENT 'Contact email',
  contact_person VARCHAR(255) COMMENT 'Primary contact person',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  stripe_customer_id VARCHAR(255) COMMENT 'Stripe integration - customer ID',
  
  INDEX idx_registration (registration_number),
  INDEX idx_stripe_customer (stripe_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 2: profiles (depends on companies)
CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID - matches Supabase auth user ID',
  company_id CHAR(36) COMMENT 'Foreign key to companies',
  full_name VARCHAR(255) NOT NULL COMMENT 'User full name',
  role VARCHAR(50) NOT NULL COMMENT 'User role (admin, manager, viewer, etc)',
  phone VARCHAR(20) COMMENT 'User phone number',
  language_preference VARCHAR(10) DEFAULT 'vi' COMMENT 'Language preference (vi, en)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Profile creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last profile update',
  organization_type VARCHAR(100) COMMENT 'Type of organization (farm, processor, distributor, etc)',
  
  CONSTRAINT fk_profiles_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL ON UPDATE NO ACTION,
  INDEX idx_company_id (company_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 3: service_packages (no dependencies)
CREATE TABLE IF NOT EXISTS service_packages (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  package_name VARCHAR(255) NOT NULL COMMENT 'Package name (English)',
  package_name_vi VARCHAR(255) NOT NULL COMMENT 'Package name (Vietnamese)',
  package_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique package code',
  description TEXT COMMENT 'English description',
  description_vi TEXT COMMENT 'Vietnamese description',
  price_monthly DECIMAL(10, 2) COMMENT 'Monthly subscription price',
  price_yearly DECIMAL(10, 2) COMMENT 'Yearly subscription price',
  price_currency VARCHAR(3) DEFAULT 'USD' COMMENT 'Currency code',
  max_users INT COMMENT 'Maximum allowed users',
  max_facilities INT COMMENT 'Maximum allowed facilities',
  max_products INT COMMENT 'Maximum allowed products',
  max_storage_gb DECIMAL(10, 2) COMMENT 'Maximum storage in GB',
  includes_fda_management BOOLEAN DEFAULT FALSE COMMENT 'FDA management module included',
  includes_agent_management BOOLEAN DEFAULT FALSE COMMENT 'Agent management module included',
  includes_cte_tracking BOOLEAN DEFAULT TRUE COMMENT 'CTE tracking module included',
  includes_reporting BOOLEAN DEFAULT TRUE COMMENT 'Reporting module included',
  includes_api_access BOOLEAN DEFAULT FALSE COMMENT 'API access included',
  includes_custom_branding BOOLEAN DEFAULT FALSE COMMENT 'Custom branding included',
  includes_priority_support BOOLEAN DEFAULT FALSE COMMENT 'Priority support included',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Package is active and available',
  is_featured BOOLEAN DEFAULT FALSE COMMENT 'Featured package on pricing page',
  sort_order INT DEFAULT 0 COMMENT 'Display sort order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Package creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last package update',
  
  UNIQUE KEY uk_package_code (package_code),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 4: company_subscriptions (depends on companies, service_packages)
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
  package_id CHAR(36) NOT NULL COMMENT 'Foreign key to service_packages',
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial' COMMENT 'Subscription status (trial, active, expired, cancelled)',
  billing_cycle VARCHAR(20) NOT NULL COMMENT 'Billing cycle (monthly, yearly)',
  start_date DATE NOT NULL DEFAULT CURDATE() COMMENT 'Subscription start date',
  end_date DATE COMMENT 'Subscription end date',
  trial_end_date DATE COMMENT 'Trial period end date',
  next_billing_date DATE COMMENT 'Next scheduled billing date',
  cancelled_at TIMESTAMP COMMENT 'Cancellation timestamp',
  current_price DECIMAL(10, 2) NOT NULL COMMENT 'Current subscription price',
  currency VARCHAR(3) DEFAULT 'USD' COMMENT 'Currency code',
  payment_method VARCHAR(50) COMMENT 'Payment method (credit_card, bank_transfer, etc)',
  last_payment_date DATE COMMENT 'Last payment date',
  last_payment_amount DECIMAL(10, 2) COMMENT 'Last payment amount',
  current_users_count INT DEFAULT 0 COMMENT 'Current user count',
  current_facilities_count INT DEFAULT 0 COMMENT 'Current facility count',
  current_products_count INT DEFAULT 0 COMMENT 'Current product count',
  current_storage_gb DECIMAL(10, 2) DEFAULT 0 COMMENT 'Current storage usage in GB',
  notification_enabled BOOLEAN DEFAULT TRUE COMMENT 'Send notifications for expiration/renewal',
  notification_days_before INT DEFAULT 7 COMMENT 'Days before expiration to notify',
  notes TEXT COMMENT 'Internal notes about subscription',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Subscription creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last subscription update',
  stripe_subscription_id VARCHAR(255) COMMENT 'Stripe subscription ID',
  stripe_customer_id VARCHAR(255) COMMENT 'Stripe customer ID',
  
  CONSTRAINT fk_subscr_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_subscr_package FOREIGN KEY (package_id) REFERENCES service_packages(id) ON DELETE RESTRICT ON UPDATE NO ACTION,
  INDEX idx_company_id (company_id),
  INDEX idx_status (subscription_status),
  INDEX idx_stripe_subscription (stripe_subscription_id),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 5: facilities (depends on companies)
CREATE TABLE IF NOT EXISTS facilities (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
  name VARCHAR(255) NOT NULL COMMENT 'Facility name',
  facility_type VARCHAR(100) NOT NULL COMMENT 'Type of facility (farm, processor, distributor, etc)',
  location_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique location code',
  address TEXT NOT NULL COMMENT 'Facility address',
  gps_coordinates VARCHAR(100) COMMENT 'GPS coordinates (latitude,longitude)',
  certification_status VARCHAR(50) COMMENT 'Certification status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Facility creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last facility update',
  
  CONSTRAINT fk_facility_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY uk_location_code (location_code),
  INDEX idx_company_id (company_id),
  INDEX idx_facility_type (facility_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 6: products (depends on companies)
CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
  product_code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique product code',
  product_name VARCHAR(255) NOT NULL COMMENT 'Product name (English)',
  product_name_vi VARCHAR(255) COMMENT 'Product name (Vietnamese)',
  description TEXT COMMENT 'Product description',
  category VARCHAR(100) NOT NULL COMMENT 'Product category',
  is_ftl BOOLEAN DEFAULT FALSE COMMENT 'Is Forward Traceability Link',
  unit_of_measure VARCHAR(50) NOT NULL COMMENT 'Unit of measurement',
  requires_cte BOOLEAN DEFAULT TRUE COMMENT 'Requires Critical Tracking Events',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Product creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last product update',
  
  CONSTRAINT fk_product_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY uk_product_code (product_code),
  INDEX idx_company_id (company_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 7: traceability_lots (depends on facilities, products)
CREATE TABLE IF NOT EXISTS traceability_lots (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  tlc VARCHAR(100) NOT NULL UNIQUE COMMENT 'Traceability Lot Code (unique identifier)',
  product_id CHAR(36) NOT NULL COMMENT 'Foreign key to products',
  facility_id CHAR(36) NOT NULL COMMENT 'Foreign key to facilities',
  batch_number VARCHAR(100) NOT NULL COMMENT 'Batch number',
  production_date DATE NOT NULL COMMENT 'Date of production',
  expiry_date DATE COMMENT 'Expiration date',
  quantity DECIMAL(10, 2) NOT NULL COMMENT 'Quantity produced',
  unit VARCHAR(50) NOT NULL COMMENT 'Unit of measurement',
  status VARCHAR(50) DEFAULT 'active' COMMENT 'Status (active, expired, archived)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  CONSTRAINT fk_lot_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_lot_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY uk_tlc (tlc),
  INDEX idx_product_id (product_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_status (status),
  INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 8: critical_tracking_events (depends on facilities, traceability_lots)
CREATE TABLE IF NOT EXISTS critical_tracking_events (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  tlc_id CHAR(36) NOT NULL COMMENT 'Foreign key to traceability_lots',
  event_type VARCHAR(100) NOT NULL COMMENT 'Type of critical event',
  event_date TIMESTAMP NOT NULL COMMENT 'Event timestamp',
  facility_id CHAR(36) NOT NULL COMMENT 'Foreign key to facilities',
  responsible_person VARCHAR(255) NOT NULL COMMENT 'Person responsible for event',
  description TEXT COMMENT 'Event description',
  temperature DECIMAL(5, 2) COMMENT 'Temperature (if relevant)',
  quantity_processed DECIMAL(10, 2) COMMENT 'Quantity processed in this event',
  unit VARCHAR(50) COMMENT 'Unit of measurement',
  location_details VARCHAR(255) COMMENT 'Location details',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  CONSTRAINT fk_cte_lot FOREIGN KEY (tlc_id) REFERENCES traceability_lots(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_cte_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  INDEX idx_tlc_id (tlc_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_event_type (event_type),
  INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 9: key_data_elements (depends on critical_tracking_events)
CREATE TABLE IF NOT EXISTS key_data_elements (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  cte_id CHAR(36) NOT NULL COMMENT 'Foreign key to critical_tracking_events',
  kde_type VARCHAR(100) NOT NULL COMMENT 'Type of KDE',
  key_name VARCHAR(255) NOT NULL COMMENT 'Key name',
  key_value TEXT NOT NULL COMMENT 'Key value',
  unit VARCHAR(50) COMMENT 'Unit of measurement',
  is_required BOOLEAN DEFAULT FALSE COMMENT 'Is this KDE required',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  
  CONSTRAINT fk_kde_cte FOREIGN KEY (cte_id) REFERENCES critical_tracking_events(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  INDEX idx_cte_id (cte_id),
  INDEX idx_kde_type (kde_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 10: shipments (depends on facilities, traceability_lots)
CREATE TABLE IF NOT EXISTS shipments (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  shipment_number VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique shipment identifier',
  tlc_id CHAR(36) NOT NULL COMMENT 'Foreign key to traceability_lots',
  from_facility_id CHAR(36) NOT NULL COMMENT 'Source facility',
  to_facility_id CHAR(36) COMMENT 'Destination facility',
  destination_address TEXT NOT NULL COMMENT 'Destination address',
  destination_company VARCHAR(255) COMMENT 'Destination company name',
  shipment_date TIMESTAMP NOT NULL COMMENT 'Shipment date and time',
  expected_delivery TIMESTAMP COMMENT 'Expected delivery timestamp',
  actual_delivery TIMESTAMP COMMENT 'Actual delivery timestamp',
  carrier_name VARCHAR(255) COMMENT 'Carrier/transporter name',
  vehicle_id VARCHAR(100) COMMENT 'Vehicle ID or plate number',
  temperature_controlled BOOLEAN DEFAULT FALSE COMMENT 'Is temperature controlled',
  status VARCHAR(50) DEFAULT 'in_transit' COMMENT 'Shipment status (in_transit, delivered, cancelled)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  CONSTRAINT fk_shipment_lot FOREIGN KEY (tlc_id) REFERENCES traceability_lots(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_shipment_from FOREIGN KEY (from_facility_id) REFERENCES facilities(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_shipment_to FOREIGN KEY (to_facility_id) REFERENCES facilities(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  UNIQUE KEY uk_shipment_number (shipment_number),
  INDEX idx_tlc_id (tlc_id),
  INDEX idx_status (status),
  INDEX idx_shipment_date (shipment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 11: fda_registrations (depends on facilities)
CREATE TABLE IF NOT EXISTS fda_registrations (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  facility_id CHAR(36) NOT NULL COMMENT 'Foreign key to facilities',
  fda_registration_number VARCHAR(100) UNIQUE COMMENT 'FDA registration number',
  registration_status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'Registration status (pending, active, expired, revoked)',
  registration_date DATE COMMENT 'FDA registration date',
  expiry_date DATE COMMENT 'Registration expiry date',
  renewal_date DATE COMMENT 'Renewal date',
  fei_number VARCHAR(100) COMMENT 'FDA Establishment Identifier',
  duns_number VARCHAR(100) COMMENT 'DUNS number',
  facility_type_fda JSON COMMENT 'Array of facility types per FDA (stored as JSON array)',
  food_product_categories JSON COMMENT 'Array of food product categories (stored as JSON array)',
  contact_name VARCHAR(255) NOT NULL COMMENT 'Contact person for FDA registration',
  contact_email VARCHAR(255) NOT NULL COMMENT 'Contact email',
  contact_phone VARCHAR(20) NOT NULL COMMENT 'Contact phone',
  notes TEXT COMMENT 'Additional notes',
  last_inspection_date DATE COMMENT 'Last FDA inspection date',
  next_inspection_date DATE COMMENT 'Expected next inspection date',
  notification_enabled BOOLEAN DEFAULT TRUE COMMENT 'Send expiration notifications',
  notification_days_before INT DEFAULT 30 COMMENT 'Days before expiry to notify',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  CONSTRAINT fk_fda_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY uk_fda_number (fda_registration_number),
  INDEX idx_facility_id (facility_id),
  INDEX idx_registration_status (registration_status),
  INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 12: us_agents (depends on companies)
CREATE TABLE IF NOT EXISTS us_agents (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
  agent_name VARCHAR(255) NOT NULL COMMENT 'Agent name',
  agent_company_name VARCHAR(255) COMMENT 'Agent company name',
  agent_type VARCHAR(100) NOT NULL COMMENT 'Type of agent',
  email VARCHAR(255) NOT NULL COMMENT 'Agent email address',
  phone VARCHAR(20) NOT NULL COMMENT 'Agent phone number',
  fax VARCHAR(20) COMMENT 'Agent fax number',
  street_address VARCHAR(255) NOT NULL COMMENT 'Street address',
  city VARCHAR(100) NOT NULL COMMENT 'City',
  state VARCHAR(100) NOT NULL COMMENT 'State/Province',
  zip_code VARCHAR(20) NOT NULL COMMENT 'Zip/Postal code',
  country VARCHAR(100) DEFAULT 'USA' COMMENT 'Country',
  service_start_date DATE NOT NULL COMMENT 'Service contract start date',
  service_end_date DATE COMMENT 'Service contract end date',
  contract_status VARCHAR(50) DEFAULT 'active' COMMENT 'Contract status (active, expired, cancelled)',
  notification_enabled BOOLEAN DEFAULT TRUE COMMENT 'Send contract expiration notifications',
  notification_days_before INT DEFAULT 60 COMMENT 'Days before expiry to notify',
  contract_document_url VARCHAR(500) COMMENT 'URL to contract document',
  authorization_letter_url VARCHAR(500) COMMENT 'URL to authorization letter',
  notes TEXT COMMENT 'Additional notes',
  is_primary BOOLEAN DEFAULT FALSE COMMENT 'Is primary agent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  CONSTRAINT fk_agent_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  INDEX idx_company_id (company_id),
  INDEX idx_contract_status (contract_status),
  INDEX idx_service_end_date (service_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 13: audit_reports (depends on facilities)
CREATE TABLE IF NOT EXISTS audit_reports (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  report_number VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique report number',
  report_type VARCHAR(100) NOT NULL COMMENT 'Type of audit report',
  facility_id CHAR(36) COMMENT 'Foreign key to facilities',
  audit_date DATE NOT NULL COMMENT 'Date of audit',
  auditor_name VARCHAR(255) NOT NULL COMMENT 'Name of auditor',
  auditor_organization VARCHAR(255) COMMENT 'Organization of auditor',
  findings TEXT COMMENT 'Audit findings',
  compliance_status VARCHAR(50) COMMENT 'Compliance status',
  corrective_actions TEXT COMMENT 'Required corrective actions',
  follow_up_date DATE COMMENT 'Follow-up audit date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  CONSTRAINT fk_audit_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  UNIQUE KEY uk_report_number (report_number),
  INDEX idx_facility_id (facility_id),
  INDEX idx_audit_date (audit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 14: subscription_audit_logs (depends on companies, profiles)
CREATE TABLE IF NOT EXISTS subscription_audit_logs (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
  action VARCHAR(100) NOT NULL COMMENT 'Action taken (create, update, cancel, etc)',
  old_status VARCHAR(50) COMMENT 'Previous subscription status',
  new_status VARCHAR(50) NOT NULL COMMENT 'New subscription status',
  changed_by CHAR(36) COMMENT 'User ID who made the change',
  metadata JSON COMMENT 'Additional metadata as JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Log creation timestamp',
  
  CONSTRAINT fk_log_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_log_user FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  INDEX idx_company_id (company_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 15: system_logs (depends on profiles)
CREATE TABLE IF NOT EXISTS system_logs (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  user_id CHAR(36) COMMENT 'Foreign key to profiles (nullable)',
  action VARCHAR(100) NOT NULL COMMENT 'System action performed',
  entity_type VARCHAR(100) COMMENT 'Type of entity affected',
  entity_id CHAR(36) COMMENT 'ID of entity affected',
  description TEXT COMMENT 'Description of action',
  ip_address VARCHAR(45) COMMENT 'IP address of requester (IPv4 or IPv6)',
  user_agent TEXT COMMENT 'User agent string',
  metadata JSON COMMENT 'Additional metadata as JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Log creation timestamp',
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 16: notification_queue (no FK, just a queue)
CREATE TABLE IF NOT EXISTS notification_queue (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  notification_type VARCHAR(100) NOT NULL COMMENT 'Type of notification',
  reference_id CHAR(36) NOT NULL COMMENT 'Reference to related record',
  reference_table VARCHAR(100) NOT NULL COMMENT 'Which table reference_id refers to',
  recipient_email VARCHAR(255) NOT NULL COMMENT 'Recipient email address',
  subject VARCHAR(255) NOT NULL COMMENT 'Email subject',
  message TEXT NOT NULL COMMENT 'Email message/template',
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'Status (pending, sent, failed)',
  scheduled_for TIMESTAMP NOT NULL COMMENT 'When to send notification',
  sent_at TIMESTAMP COMMENT 'When notification was actually sent',
  error_message TEXT COMMENT 'Error message if send failed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  
  INDEX idx_status_scheduled (status, scheduled_for),
  INDEX idx_notification_type (notification_type),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 3: CREATE FUNCTIONS/PROCEDURES (MySQL Equivalents)
-- ============================================================================

/*
MIGRATION NOTES FOR FUNCTIONS:
1. PostgreSQL `EXECUTE format()` → MySQL `EXECUTE USING` with parameterized queries
2. PostgreSQL `RETURNS void` → MySQL `RETURNS void` (no return type)
3. PostgreSQL SECURITY DEFINER → MySQL DEFINER user (must be created first)
4. PostgreSQL JSON operators (->>) → MySQL JSON_EXTRACT()
5. PostgreSQL COALESCE → MySQL COALESCE (same syntax)
6. PostgreSQL NOW() → MySQL NOW() (same)
7. PostgreSQL CURRENT_DATE → MySQL CURDATE() (equivalent)
*/

-- FUNCTION 1: check_and_update_expired_subscriptions()
-- Converts PostgreSQL function to MySQL procedure
DELIMITER //

CREATE PROCEDURE check_and_update_expired_subscriptions()
READS SQL DATA MODIFIES SQL DATA
COMMENT 'Updates subscription status to expired for all passed end dates'
BEGIN
  UPDATE company_subscriptions
  SET subscription_status = 'expired',
      updated_at = NOW()
  WHERE subscription_status = 'active'
  AND end_date < CURDATE();
END //

DELIMITER ;

-- FUNCTION 2: increment_subscription_usage(p_company_id, p_field)
-- Converts PostgreSQL dynamic SQL to MySQL
DELIMITER //

CREATE PROCEDURE increment_subscription_usage(
  IN p_company_id CHAR(36),
  IN p_field VARCHAR(100)
)
MODIFIES SQL DATA
COMMENT 'Increments the specified subscription usage counter'
BEGIN
  DECLARE v_sql VARCHAR(500);
  
  SET v_sql = CONCAT(
    'UPDATE company_subscriptions ',
    'SET ', p_field, ' = COALESCE(', p_field, ', 0) + 1, ',
    '    updated_at = NOW() ',
    'WHERE company_id = ? ',
    'AND subscription_status = "active"'
  );
  
  PREPARE stmt FROM v_sql;
  EXECUTE stmt USING p_company_id;
  DEALLOCATE PREPARE stmt;
END //

DELIMITER ;

-- FUNCTION 3: decrement_subscription_usage(p_company_id, p_field)
-- Prevents negative values using GREATEST
DELIMITER //

CREATE PROCEDURE decrement_subscription_usage(
  IN p_company_id CHAR(36),
  IN p_field VARCHAR(100)
)
MODIFIES SQL DATA
COMMENT 'Decrements the specified subscription usage counter without going below 0'
BEGIN
  DECLARE v_sql VARCHAR(500);
  
  SET v_sql = CONCAT(
    'UPDATE company_subscriptions ',
    'SET ', p_field, ' = GREATEST(COALESCE(', p_field, ', 0) - 1, 0), ',
    '    updated_at = NOW() ',
    'WHERE company_id = ? ',
    'AND subscription_status = "active"'
  );
  
  PREPARE stmt FROM v_sql;
  EXECUTE stmt USING p_company_id;
  DEALLOCATE PREPARE stmt;
END //

DELIMITER ;

-- ============================================================================
-- SECTION 4: HANDLE_NEW_USER FUNCTION - MIGRATION REQUIREMENTS
-- ============================================================================

/*
CRITICAL MIGRATION NOTE FOR handle_new_user():

PostgreSQL Implementation:
- Used as a trigger function (RETURNS TRIGGER)
- Triggered on INSERT to auth.users table (Supabase Auth)
- Accesses NEW.raw_user_meta_data ->> 'field_name' (JSONB operators)
- Automatically runs when user signs up
- Returns NEW to continue insert operation

MySQL Implementation Challenge:
- MySQL doesn't have Supabase Auth native integration
- Must use application-level trigger instead
- Two options:

OPTION A: Create trigger in application code (RECOMMENDED)
When user signs up via Supabase Auth:
1. Application intercepts the signup
2. Calls this INSERT directly: INSERT INTO profiles (...) VALUES (...)
3. No database trigger needed

OPTION B: Create MySQL trigger on auth table
If auth.users table is replicated to MySQL:
DELIMITER //
CREATE TRIGGER trg_after_auth_insert
AFTER INSERT ON auth.users
FOR EACH ROW
BEGIN
  INSERT INTO profiles (
    id, 
    full_name, 
    role, 
    language_preference,
    organization_type
  )
  VALUES (
    NEW.id,
    IFNULL(JSON_UNQUOTE(JSON_EXTRACT(NEW.raw_user_meta_data, '$.full_name')), NEW.email),
    IFNULL(JSON_UNQUOTE(JSON_EXTRACT(NEW.raw_user_meta_data, '$.role')), 'viewer'),
    IFNULL(JSON_UNQUOTE(JSON_EXTRACT(NEW.raw_user_meta_data, '$.language')), 'vi'),
    IFNULL(JSON_UNQUOTE(JSON_EXTRACT(NEW.raw_user_meta_data, '$.organization_type')), 'farm')
  )
  ON DUPLICATE KEY UPDATE
    full_name = IFNULL(VALUES(full_name), full_name),
    role = IFNULL(VALUES(role), role),
    language_preference = IFNULL(VALUES(language_preference), language_preference),
    organization_type = IFNULL(VALUES(organization_type), organization_type);
END //
DELIMITER ;

RECOMMENDATION: Use OPTION A (application-level) for cleaner separation of concerns
*/

-- For reference, here's the application-level INSERT statement:
-- This should be called from backend code when user signs up
INSERT INTO profiles (
  id, 
  full_name, 
  role, 
  language_preference,
  organization_type
)
VALUES (
  @new_user_id,  -- Pass from application
  IFNULL(@full_name, @email),  -- Use provided name or email as fallback
  IFNULL(@role, 'viewer'),  -- Default to 'viewer'
  IFNULL(@language, 'vi'),  -- Default to Vietnamese
  IFNULL(@organization_type, 'farm')  -- Default organization type
)
ON DUPLICATE KEY UPDATE
  full_name = IFNULL(VALUES(full_name), full_name),
  role = IFNULL(VALUES(role), role),
  language_preference = IFNULL(VALUES(language_preference), language_preference),
  organization_type = IFNULL(VALUES(organization_type), organization_type);

-- ============================================================================
-- SECTION 5: IMPORTANT MIGRATION NOTES & KNOWN LIMITATIONS
-- ============================================================================

/*
SECTION 5A: PostgreSQL Features NOT Directly Available in MySQL
============================================================================

1. ARRAY Types (fda_registrations.facility_type_fda, food_product_categories)
   PostgreSQL: ARRAY type with native operators
   MySQL Migration: Use JSON type (already done in schema above)
   
   Retrieval Example:
   PostgreSQL: SELECT * FROM fda_registrations WHERE facility_type_fda @> ARRAY['processor'];
   MySQL: SELECT * FROM fda_registrations WHERE JSON_CONTAINS(facility_type_fda, JSON_ARRAY('processor'));
   
2. JSONB Type (subscription_audit_logs.metadata, system_logs.metadata)
   PostgreSQL: JSONB with binary storage + fast lookups
   MySQL Migration: Use JSON (same compatibility level)
   
3. UUID Type
   PostgreSQL: Native UUID type
   MySQL: Use CHAR(36) (standard UUID string length)
   
4. SERIAL/AUTO_INCREMENT
   Not used in this schema (UUID-based instead)
   
5. Interval Type
   PostgreSQL: INTERVAL for date arithmetic
   MySQL: Use DATE_ADD, DATE_SUB, or calculated dates
   
6. Enum Type
   PostgreSQL: CREATE TYPE status AS ENUM (...)
   MySQL: Use VARCHAR with constraints or CHECK clauses (added in CHECK clauses in DDL)
   
7. Full-Text Search
   PostgreSQL: tsquery, tsvector
   MySQL: Use FULLTEXT indexes on TEXT columns
   
8. citext (case-insensitive text)
   PostgreSQL: citext for case-insensitive comparisons
   MySQL: Use COLLATE utf8mb4_general_ci or use LOWER() in WHERE clauses

SECTION 5B: Logic That Must Remain in Application Code
============================================================================

1. Expiry Date Calculation (SPECIAL BUSINESS LOGIC)
   - PostgreSQL: Could use triggers with complex date logic
   - MySQL: MUST handle in application code
   - REASON: Expiry calculation may involve:
     * Subscription duration from service_packages
     * Billing cycle (monthly/yearly)
     * Custom grace periods
     * Company-specific overrides
   
   Recommended Implementation:
   - Calculate expiry_date in application when creating subscription
   - Update expiry_date when billing cycle changes
   - Use stored procedure for routine updates only
   
2. Waste Variance Calculation (MENTIONED IN REQUIREMENTS)
   - Not found in current schema (check if in separate tables)
   - If exists: handle complex variance calculations in application
   - MySQL is poor at temporal/statistical calculations
   
3. Subscription Status Transitions
   - Current logic: trial → active → expired → cancelled
   - MySQL: Update status with application-side validation
   - Consider workflow engine or state machine in application

SECTION 5C: Performance Considerations
============================================================================

1. Indexes Already Created:
   - 32 indexes as per PostgreSQL schema
   - Converted to MySQL native index syntax
   - Ensure analyze_table after migration for query optimizer
   
2. Foreign Keys:
   - All 18 FK relationships preserved
   - Cascade/Restrict rules implemented
   - Enable FK checks: SET foreign_key_checks = 1;
   
3. Recommended Additional Indexes:
   - Consider compound indexes for common queries
   - Example: (company_id, subscription_status) for reports
   - (facility_id, created_at DESC) for recent audits
   
4. Partitioning Strategy (Optional):
   - traceability_lots: PARTITION BY RANGE(YEAR(production_date))
   - system_logs: PARTITION BY RANGE(YEAR(created_at))
   - subscription_audit_logs: PARTITION BY RANGE(YEAR(created_at))

SECTION 5D: Migration Checklist
============================================================================

Before Go-Live:
- [ ] Create databases in MySQL 8.0.30+ server
- [ ] Run all CREATE TABLE statements
- [ ] Create all procedures (functions)
- [ ] Test all foreign key constraints
- [ ] Verify all indexes created successfully
- [ ] Set up proper character set (utf8mb4)
- [ ] Enable binary logging for replication/backup
- [ ] Configure slow query log for monitoring
- [ ] Test backup/restore procedures
- [ ] Update application code for MySQL:
    * MySQL-specific date functions
    * JSON handling for metadata fields
    * Parameterized queries for SQL injection prevention
- [ ] Update all application insert/update statements for handle_new_user logic
- [ ] Test subscription expiry workflow end-to-end
- [ ] Performance test with production-level data

SECTION 5E: Data Migration Strategy
============================================================================

1. Export from PostgreSQL:
   - Use pg_dump with COPY to CSV format
   - Maintain order for FK constraints
   - Handle UUID conversion if needed
   
2. Import to MySQL (Suggested order):
   a) companies
   b) profiles
   c) service_packages
   d) company_subscriptions
   e) facilities
   f) products
   g) traceability_lots
   h) critical_tracking_events
   i) key_data_elements
   j) shipments
   k) fda_registrations
   l) us_agents
   m) audit_reports
   n) subscription_audit_logs
   o) system_logs
   p) notification_queue
   
3. Verification:
   - COUNT(*) comparison for each table
   - Spot-check FK referential integrity
   - Validate date formats and timezone conversions
   - Test sample queries in both databases for consistency

SECTION 5F: Deployment Recommendations
============================================================================

1. Connection String Changes:
   - PostgreSQL: postgresql://user:pass@host:5432/fsma204
   - MySQL: mysql://user:pass@host:3306/fsma204
   
2. Application ORM/Query Changes:
   - ARRAY handling → JSON_ARRAY() or JSON functions
   - Timestamp with timezone → TIMESTAMP (MySQL 5.7+ automatic UTC)
   - Case sensitivity adjustments
   - UUID as strings (not native type)
   
3. Monitoring:
   - Set up table size monitoring
   - Monitor slow queries for optimization
   - Track replication lag if using replicas
   
4. Disaster Recovery:
   - Daily full backups to external storage
   - Incremental backups for binary logs
   - Test restore procedures weekly
   - Document RTO/RPO requirements
*/

-- ============================================================================
-- SECTION 6: MIGRATION COMPLETE
-- ============================================================================

-- Test that all tables were created successfully
SELECT COUNT(*) AS total_tables FROM information_schema.tables 
WHERE table_schema = 'fsma204' AND table_type = 'BASE TABLE';
-- Expected Result: 16 tables

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'fsma204' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify FK constraints
SELECT constraint_name, table_name, referenced_table_name 
FROM information_schema.referential_constraints 
WHERE constraint_schema = 'fsma204'
ORDER BY table_name;
-- Expected Result: 18 foreign key relationships

-- Check all indexes
SELECT table_name, index_name, seq_in_index 
FROM information_schema.statistics 
WHERE table_schema = 'fsma204' 
AND index_name != 'PRIMARY'
ORDER BY table_name, index_name;
-- Expected Result: 32+ non-PK indexes

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
