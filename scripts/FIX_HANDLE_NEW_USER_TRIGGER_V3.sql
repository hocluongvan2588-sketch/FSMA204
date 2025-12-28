-- Fix handle_new_user function to use SECURITY DEFINER
-- This allows the function to bypass RLS and insert data successfully

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- This is the key fix - function runs with definer's privileges
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  company_id_var UUID;
  package_id_var UUID;
BEGIN
  -- Get the Free package ID
  SELECT id INTO package_id_var
  FROM service_packages
  WHERE name = 'Free'
  LIMIT 1;

  -- If no Free package exists, raise error
  IF package_id_var IS NULL THEN
    RAISE EXCEPTION 'Free service package not found';
  END IF;

  -- Create a new company for the user
  INSERT INTO companies (
    name,
    registration_number,
    address,
    phone
  ) VALUES (
    NEW.email || ' Company',
    'REG-' || SUBSTRING(NEW.id::TEXT, 1, 8),
    'Default Address',
    'N/A'
  )
  RETURNING id INTO company_id_var;

  -- Added billing_cycle, price_paid, and end_date required fields
  -- Create company subscription with Free package
  INSERT INTO company_subscriptions (
    company_id,
    package_id,
    billing_cycle,
    price_paid,
    status,
    start_date,
    end_date
  ) VALUES (
    company_id_var,
    package_id_var,
    'monthly',
    0,
    'active',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year'
  );

  -- Create user profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    company_id
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.email,
    'company_admin',
    company_id_var
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
