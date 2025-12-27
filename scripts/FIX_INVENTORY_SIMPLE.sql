-- ============================================
-- SIMPLE INVENTORY FIX SCRIPT
-- Fix available_quantity for existing CTEs
-- and create working trigger for new CTEs
-- ============================================

-- STEP 1: Create or replace the inventory deduction function
CREATE OR REPLACE FUNCTION handle_cte_inventory_deduction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process cooling, packaging, and shipping events
  IF NEW.event_type IN ('cooling', 'packing', 'shipping') THEN
    
    -- Use quantity_processed instead of quantity (correct column name)
    -- Deduct from available_quantity
    UPDATE traceability_lots
    SET available_quantity = COALESCE(available_quantity, quantity) - NEW.quantity_processed
    WHERE id = NEW.tlc_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- STEP 2: Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS auto_deduct_inventory_on_cte ON critical_tracking_events;

CREATE TRIGGER auto_deduct_inventory_on_cte
  AFTER INSERT ON critical_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_cte_inventory_deduction();

-- Use quantity_processed instead of quantity in UPDATE statement
-- STEP 3: Fix existing data - recalculate available_quantity
UPDATE traceability_lots tl
SET available_quantity = tl.quantity - COALESCE(used.total_used, 0)
FROM (
  SELECT 
    cte.tlc_id,
    SUM(cte.quantity_processed) as total_used
  FROM critical_tracking_events cte
  WHERE cte.event_type IN ('cooling', 'packing', 'shipping')
  GROUP BY cte.tlc_id
) used
WHERE tl.id = used.tlc_id;

-- STEP 4: Verify results
SELECT 
  'Trigger Status' as check_type,
  COUNT(*) as result
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'critical_tracking_events'
  AND t.tgname = 'auto_deduct_inventory_on_cte'

UNION ALL

SELECT 
  'Sample Inventory' as check_type,
  available_quantity as result
FROM traceability_lots
WHERE tlc = 'RCV-204';
