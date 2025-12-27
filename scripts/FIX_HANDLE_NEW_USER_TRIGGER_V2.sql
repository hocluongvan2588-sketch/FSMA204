-- =============================================
-- FIX V2: handle_new_user trigger
-- Issue: package_code column doesn't exist, should use name = 'Free'
-- Solution: Query service_packages by name instead of package_code
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id UUID;
  v_free_package_id UUID;
  v_free_package_price NUMERIC;
BEGIN
  -- Get or create company
  IF NEW.raw_user_meta_data->>'company_id' IS NOT NULL 
     AND (NEW.raw_user_meta_data->>'company_id')::UUID IS NOT NULL THEN
    -- Use existing company ID from metadata
    v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
  ELSE
    -- Create unique registration_number with timestamp to avoid duplicate key error
    INSERT INTO public.companies (
      name,
      registration_number,
      address,
      email,
      contact_person
    )
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'TEMP-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || (FLOOR(RANDOM() * 10000))::INT,
      COALESCE(NEW.raw_user_meta_data->>'address', 'Chưa cập nhật'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    RETURNING id INTO v_company_id;

    -- Query by name = 'Free' instead of package_code = 'FREE'
    SELECT id, price_monthly INTO v_free_package_id, v_free_package_price
    FROM public.service_packages
    WHERE name = 'Free'
    LIMIT 1;

    IF v_free_package_id IS NOT NULL THEN
      INSERT INTO public.company_subscriptions (
        company_id,
        package_id,
        subscription_status,
        billing_cycle,
        start_date,
        current_price,
        currency
      )
      VALUES (
        v_company_id,
        v_free_package_id,
        'active',
        'monthly',
        CURRENT_DATE,
        COALESCE(v_free_package_price, 0),
        'VND'
      );
    END IF;
  END IF;

  -- Create user profile
  INSERT INTO public.profiles (
    id,
    company_id,
    full_name,
    phone,
    role,
    organization_type
  )
  VALUES (
    NEW.id,
    v_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    COALESCE(NEW.raw_user_meta_data->>'organization_type', 'farm')
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Recreate trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the fix
DO $$
DECLARE
  v_package_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM service_packages WHERE name = 'Free') INTO v_package_exists;
  
  IF v_package_exists THEN
    RAISE NOTICE 'SUCCESS: Free package found, trigger should work correctly now';
  ELSE
    RAISE WARNING 'WARNING: Free package not found in service_packages table';
  END IF;
END $$;
