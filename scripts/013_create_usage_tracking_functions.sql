-- Function to increment subscription usage counters
CREATE OR REPLACE FUNCTION increment_subscription_usage(
  p_company_id UUID,
  p_field TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the specified counter field
  EXECUTE format(
    'UPDATE company_subscriptions 
     SET %I = COALESCE(%I, 0) + 1,
         updated_at = NOW()
     WHERE company_id = $1 
     AND subscription_status = ''active''',
    p_field, p_field
  )
  USING p_company_id;
END;
$$;

-- Function to decrement subscription usage counters
CREATE OR REPLACE FUNCTION decrement_subscription_usage(
  p_company_id UUID,
  p_field TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the specified counter field, ensuring it doesn't go below 0
  EXECUTE format(
    'UPDATE company_subscriptions 
     SET %I = GREATEST(COALESCE(%I, 0) - 1, 0),
         updated_at = NOW()
     WHERE company_id = $1 
     AND subscription_status = ''active''',
    p_field, p_field
  )
  USING p_company_id;
END;
$$;

-- Function to check if subscription is expired and update status
CREATE OR REPLACE FUNCTION check_and_update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE company_subscriptions
  SET subscription_status = 'expired',
      updated_at = NOW()
  WHERE subscription_status = 'active'
  AND end_date < CURRENT_DATE;
END;
$$;

-- Create a scheduled job to check expired subscriptions daily
-- Note: This requires pg_cron extension to be enabled
-- Run this manually or set up a cron job externally if pg_cron is not available
-- SELECT cron.schedule('check-expired-subscriptions', '0 0 * * *', 'SELECT check_and_update_expired_subscriptions()');

COMMENT ON FUNCTION increment_subscription_usage IS 'Increment usage counter for a company subscription';
COMMENT ON FUNCTION decrement_subscription_usage IS 'Decrement usage counter for a company subscription';
COMMENT ON FUNCTION check_and_update_expired_subscriptions IS 'Check and mark expired subscriptions';
