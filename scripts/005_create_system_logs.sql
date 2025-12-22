-- System logs table for admin tracking
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'export'
  entity_type TEXT, -- 'user', 'company', 'facility', 'product', 'cte', 'shipment', etc.
  entity_id UUID,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_entity ON system_logs(entity_type, entity_id);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only system admins can view system logs
CREATE POLICY "System admins can view all logs" ON system_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'system_admin'
    )
  );

-- RLS Policy: Company admins can view logs related to their company
CREATE POLICY "Company admins can view company logs" ON system_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND (
        user_id IN (SELECT id FROM profiles WHERE company_id = profiles.company_id)
        OR entity_type = 'company' AND entity_id::TEXT = profiles.company_id::TEXT
      )
    )
  );

-- RLS Policy: System can insert logs
CREATE POLICY "Authenticated users can insert logs" ON system_logs FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON TABLE system_logs IS 'System-wide activity logs for audit and tracking';
COMMENT ON COLUMN system_logs.action IS 'Type of action performed';
COMMENT ON COLUMN system_logs.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN system_logs.metadata IS 'Additional JSON data about the action';
