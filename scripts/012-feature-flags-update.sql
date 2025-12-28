-- Add new feature flags to service_packages.features JSONB column
-- This script updates existing packages with the new feature flags

-- Update FREE package
UPDATE service_packages
SET features = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{waste_tracking}', 'false'
      ),
      '{expiration_monitoring}', 'false'
    ),
    '{advanced_inventory}', 'false'
  ),
  '{audit_trail_access}', 'false'
)
WHERE name = 'Free';

-- Update STARTER package
UPDATE service_packages
SET features = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{waste_tracking}', 'true'
      ),
      '{expiration_monitoring}', 'true'
    ),
    '{advanced_inventory}', 'false'
  ),
  '{audit_trail_access}', 'false'
)
WHERE name = 'Starter';

-- Update PROFESSIONAL package
UPDATE service_packages
SET features = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{waste_tracking}', 'true'
      ),
      '{expiration_monitoring}', 'true'
    ),
    '{advanced_inventory}', 'true'
  ),
  '{audit_trail_access}', 'false'
)
WHERE name = 'Professional';

-- Update BUSINESS package
UPDATE service_packages
SET features = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{waste_tracking}', 'true'
      ),
      '{expiration_monitoring}', 'true'
    ),
    '{advanced_inventory}', 'true'
  ),
  '{audit_trail_access}', 'true'
)
WHERE name = 'Business';

-- Update ENTERPRISE package
UPDATE service_packages
SET features = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{waste_tracking}', 'true'
      ),
      '{expiration_monitoring}', 'true'
    ),
    '{advanced_inventory}', 'true'
  ),
  '{audit_trail_access}', 'true'
)
WHERE name = 'Enterprise';

-- Verify the updates
SELECT 
  name,
  features->'waste_tracking' as waste_tracking,
  features->'expiration_monitoring' as expiration_monitoring,
  features->'advanced_inventory' as advanced_inventory,
  features->'audit_trail_access' as audit_trail_access
FROM service_packages
ORDER BY display_order;
