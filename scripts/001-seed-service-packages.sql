-- Seed 5-tier service packages for FSMA 204
-- Fixed to match actual database schema
-- Run this script to populate service packages

-- FREE TIER (Growth Driver)
INSERT INTO public.service_packages (
  name,
  description,
  price_monthly,
  price_yearly,
  features,
  limits,
  is_active,
  display_order
) VALUES (
  'Free',
  'Start learning FSMA 204 requirements with basic traceability features at no cost',
  0,
  0,
  '{"api_access": false, "priority_support": false, "custom_branding": false, "advanced_reporting": false, "sso": false}'::jsonb,
  '{"max_users": 1, "max_facilities": 1, "max_products": 3, "max_storage_gb": 0}'::jsonb,
  true,
  1
)
ON CONFLICT (name) 
DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- STARTER TIER ($99/month)
INSERT INTO public.service_packages (
  name,
  description,
  price_monthly,
  price_yearly,
  features,
  limits,
  is_active,
  display_order
) VALUES (
  'Starter',
  'Perfect for small businesses starting their US export journey with full compliance',
  99,
  990,
  '{"api_access": false, "priority_support": false, "custom_branding": false, "advanced_reporting": true, "sso": false}'::jsonb,
  '{"max_users": 5, "max_facilities": 1, "max_products": 10, "max_storage_gb": 5}'::jsonb,
  true,
  2
)
ON CONFLICT (name) 
DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- PROFESSIONAL TIER ($299/month) - MOST POPULAR
INSERT INTO public.service_packages (
  name,
  description,
  price_monthly,
  price_yearly,
  features,
  limits,
  is_active,
  display_order
) VALUES (
  'Professional',
  'Complete FDA compliance solution for growing exporters with multiple facilities',
  299,
  2990,
  '{"api_access": false, "priority_support": true, "custom_branding": false, "advanced_reporting": true, "sso": false}'::jsonb,
  '{"max_users": 20, "max_facilities": 5, "max_products": 200, "max_storage_gb": 20}'::jsonb,
  true,
  3
)
ON CONFLICT (name) 
DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- BUSINESS TIER ($699/month)
INSERT INTO public.service_packages (
  name,
  description,
  price_monthly,
  price_yearly,
  features,
  limits,
  is_active,
  display_order
) VALUES (
  'Business',
  'Enterprise features with API access, custom branding and dedicated account support',
  699,
  6990,
  '{"api_access": true, "priority_support": true, "custom_branding": true, "advanced_reporting": true, "sso": false}'::jsonb,
  '{"max_users": 999999, "max_facilities": 999999, "max_products": 999999, "max_storage_gb": 100}'::jsonb,
  true,
  4
)
ON CONFLICT (name) 
DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- ENTERPRISE TIER (Custom pricing)
INSERT INTO public.service_packages (
  name,
  description,
  price_monthly,
  price_yearly,
  features,
  limits,
  is_active,
  display_order
) VALUES (
  'Enterprise',
  'Fully customized solution with on-premise deployment, SLA guarantee and 24/7 support',
  2000,
  24000,
  '{"api_access": true, "priority_support": true, "custom_branding": true, "advanced_reporting": true, "sso": true}'::jsonb,
  '{"max_users": 999999, "max_facilities": 999999, "max_products": 999999, "max_storage_gb": 500}'::jsonb,
  true,
  5
)
ON CONFLICT (name) 
DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;
