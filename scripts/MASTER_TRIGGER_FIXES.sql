-- =====================================================
-- MASTER TRIGGER FIXES - FIX ALL CTE TRIGGER ERRORS
-- =====================================================
-- This script fixes ALL trigger functions that reference 
-- non-existent columns based on actual database schema
-- =====================================================

-- STEP 1: Fix auto_populate_kdes (runs on critical_tracking_events table)
-- Issue: References gps_coordinates (doesn't exist) - should use location_details
-- Issue: References tl.lot_code (doesn't exist) - should use tl.tlc
CREATE OR REPLACE FUNCTION auto_populate_kdes()
RETURNS TRIGGER AS $$
DECLARE
    v_product_name TEXT;
    v_product_code TEXT;
    v_lot_code TEXT;
    v_production_date DATE;
    v_expiry_date DATE;
    v_quantity NUMERIC;
    v_unit TEXT;
BEGIN
    -- Get traceability lot info
    SELECT 
        p.product_name,
        p.product_code,
        tl.tlc,  -- Changed from tl.lot_code to tl.tlc
        tl.production_date,
        tl.expiry_date,
        tl.quantity,  -- Changed from initial_quantity
        tl.unit
    INTO 
        v_product_name,
        v_product_code,
        v_lot_code,
        v_production_date,
        v_expiry_date,
        v_quantity,
        v_unit
    FROM traceability_lots tl
    JOIN products p ON tl.product_id = p.id
    WHERE tl.id = NEW.tlc_id;

    -- Auto-populate required KDEs based on event type
    IF NEW.event_type = 'production' THEN
        INSERT INTO key_data_elements (cte_id, kde_type, key_name, key_value, unit, is_required)
        VALUES 
            (NEW.id, 'production', 'Batch Number', v_lot_code, NULL, true),
            (NEW.id, 'production', 'Production Date', v_production_date::text, NULL, true),
            (NEW.id, 'production', 'Expiry Date', v_expiry_date::text, NULL, true),
            (NEW.id, 'production', 'Quantity Produced', v_quantity::text, v_unit, true);

    ELSIF NEW.event_type = 'receiving' THEN
        INSERT INTO key_data_elements (cte_id, kde_type, key_name, key_value, unit, is_required)
        VALUES 
            (NEW.id, 'receiving', 'Product Name', v_product_name, NULL, true),
            (NEW.id, 'receiving', 'Lot Code', v_lot_code, NULL, true),
            (NEW.id, 'receiving', 'Quantity Received', NEW.quantity_processed::text, NEW.unit, true),
            (NEW.id, 'receiving', 'Receipt Date', NEW.event_date::date::text, NULL, true); -- Changed from event_timestamp to event_date

    ELSIF NEW.event_type = 'transformation' THEN
        INSERT INTO key_data_elements (cte_id, kde_type, key_name, key_value, unit, is_required)
        VALUES 
            (NEW.id, 'transformation', 'Input Lot', v_lot_code, NULL, true),
            (NEW.id, 'transformation', 'Temperature', NEW.temperature::text, '°C', true),
            (NEW.id, 'transformation', 'Processing Time', EXTRACT(EPOCH FROM (NEW.event_date - NEW.created_at))::text, 'seconds', false); -- Changed from event_timestamp to event_date

    ELSIF NEW.event_type = 'shipping' THEN
        INSERT INTO key_data_elements (cte_id, kde_type, key_name, key_value, unit, is_required)
        VALUES 
            (NEW.id, 'shipping', 'Shipment ID', NEW.id::text, NULL, true),
            (NEW.id, 'shipping', 'Quantity Shipped', NEW.quantity_processed::text, NEW.unit, true),
            (NEW.id, 'shipping', 'Destination', NEW.location_details::text, NULL, true),
            (NEW.id, 'shipping', 'Ship Date', NEW.event_date::date::text, NULL, true); -- Changed from event_timestamp to event_date

    ELSIF NEW.event_type = 'packaging' THEN
        INSERT INTO key_data_elements (cte_id, kde_type, key_name, key_value, unit, is_required)
        VALUES 
            (NEW.id, 'packaging', 'Package Type', NEW.description, NULL, true),
            (NEW.id, 'packaging', 'Lot Code', v_lot_code, NULL, true),
            (NEW.id, 'packaging', 'Quantity Packaged', NEW.quantity_processed::text, NEW.unit, true);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Fix auto_resolve_kde_alert (runs on key_data_elements table)
-- Issue: References NEW.submitted_by but key_data_elements doesn't have submitted_by
-- Solution: Query the CTE to get submitted_by
CREATE OR REPLACE FUNCTION auto_resolve_kde_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_cte_submitted_by UUID;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.key_value IS DISTINCT FROM NEW.key_value THEN
        SELECT submitted_by INTO v_cte_submitted_by
        FROM critical_tracking_events
        WHERE id = NEW.cte_id;

        UPDATE data_quality_alerts
        SET 
            status = 'resolved',
            resolved_at = NOW(),
            resolved_by = v_cte_submitted_by,
            description = 'Auto-resolved: KDE value provided'
        WHERE entity_type = 'kde'
          AND entity_id = NEW.id
          AND status = 'open';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Fix validate_chronological_order
-- Issue: Use correct column names from schema
CREATE OR REPLACE FUNCTION validate_chronological_order()
RETURNS TRIGGER AS $$
DECLARE
    v_previous_event_time TIMESTAMPTZ;
    v_previous_event_type TEXT;
    v_event_order TEXT[] := ARRAY['receiving', 'cooling', 'packaging', 'shipping'];
    v_current_index INT;
    v_previous_index INT;
BEGIN
    SELECT event_date, event_type
    INTO v_previous_event_time, v_previous_event_type
    FROM critical_tracking_events
    WHERE tlc_id = NEW.tlc_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY event_date DESC
    LIMIT 1;

    IF v_previous_event_time IS NOT NULL THEN
        IF NEW.event_date < v_previous_event_time THEN
            RAISE EXCEPTION 'CHRONOLOGICAL VIOLATION: Event date is BEFORE the previous event.'
                USING HINT = format('Previous event (%s) was at %s. Current event is at %s.',
                    v_previous_event_type, 
                    v_previous_event_time::date,
                    NEW.event_date::date);
        END IF;

        v_current_index := array_position(v_event_order, NEW.event_type);
        v_previous_index := array_position(v_event_order, v_previous_event_type);

        IF v_current_index IS NOT NULL AND v_previous_index IS NOT NULL THEN
            IF v_current_index < v_previous_index THEN
                RAISE EXCEPTION 'EVENT SEQUENCE VIOLATION: % cannot come after %',
                    NEW.event_type, v_previous_event_type
                    USING HINT = 'Correct order is: receiving → cooling → packaging → shipping';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_cte_chronological_order ON critical_tracking_events;
CREATE TRIGGER validate_cte_chronological_order
    BEFORE INSERT OR UPDATE ON critical_tracking_events
    FOR EACH ROW
    EXECUTE FUNCTION validate_chronological_order();

-- STEP 4: Fix inventory deduction trigger
-- Issue: Use correct column names from inventory_transactions schema
-- Now updates available_quantity in traceability_lots AND logs to inventory_transactions
CREATE OR REPLACE FUNCTION handle_cte_inventory_deduction()
RETURNS TRIGGER AS $$
DECLARE
  v_deducted_quantity numeric;
BEGIN
  IF NEW.event_type IN ('cooling', 'packaging', 'shipping') THEN
    v_deducted_quantity := COALESCE(NEW.quantity_processed, 0);

    -- Update available_quantity when cooling/packaging/shipping event is created
    -- Using exact same UPDATE pattern as handle_receiving_event_inventory but with subtraction
    UPDATE traceability_lots
    SET 
      available_quantity = COALESCE(available_quantity, 0) - v_deducted_quantity,
      updated_at = NOW()
    WHERE id = NEW.tlc_id;

    -- Log to inventory_balance_logs (same table as receiving trigger) instead of inventory_transactions
    INSERT INTO inventory_balance_logs (
      tlc_id, company_id, total_input,
      total_output, total_loss_processing, expected_inventory, actual_inventory,
      variance, variance_percentage, flag_type, severity, compliance_deduction,
      recommendation, created_by
    )
    SELECT 
      NEW.tlc_id,
      (SELECT company_id FROM facilities WHERE id = NEW.facility_id),
      0,  -- No input for deduction events
      v_deducted_quantity,  -- Output
      0,
      (SELECT available_quantity FROM traceability_lots WHERE id = NEW.tlc_id),
      (SELECT available_quantity FROM traceability_lots WHERE id = NEW.tlc_id),
      0, 0, 'normal', 'ok', 0,
      NEW.event_type || ' event: ' || v_deducted_quantity || ' deducted from inventory',
      COALESCE(NEW.submitted_by, auth.uid())
    FROM traceability_lots WHERE id = NEW.tlc_id LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_deduct_inventory_on_cte ON critical_tracking_events;
CREATE TRIGGER auto_deduct_inventory_on_cte
    AFTER INSERT ON critical_tracking_events
    FOR EACH ROW
    EXECUTE FUNCTION handle_cte_inventory_deduction();

-- Verification query
SELECT 
    'Triggers created successfully!' as status,
    COUNT(*) as trigger_count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname IN ('auto_populate_kdes', 'auto_resolve_kde_alert', 
                    'validate_chronological_order', 'handle_cte_inventory_deduction');
