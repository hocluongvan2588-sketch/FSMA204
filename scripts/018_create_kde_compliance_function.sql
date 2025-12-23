-- Create function to calculate KDE compliance for FSMA 204 dashboard
CREATE OR REPLACE FUNCTION calculate_kde_compliance()
RETURNS TABLE (
  total bigint,
  with_kde bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total,
    COUNT(CASE WHEN kde_count > 0 THEN 1 END)::bigint as with_kde
  FROM (
    SELECT 
      tl.id,
      COUNT(kde.id) as kde_count
    FROM traceability_lots tl
    LEFT JOIN critical_tracking_events cte ON cte.tlc_id = tl.id
    LEFT JOIN key_data_elements kde ON kde.cte_id = cte.id
    GROUP BY tl.id
  ) lot_kde_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_kde_compliance() TO authenticated;
