-- Create subscription audit log table for tracking subscription lifecycle changes

CREATE TABLE IF NOT EXISTS subscription_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL, -- 'created', 'updated', 'cancelled', 'expired', 'trial_ended'
  old_status TEXT,
  new_status TEXT NOT NULL,
  
  -- User who triggered the change (nullable for system actions)
  changed_by UUID REFERENCES profiles(id),
  
  -- Additional metadata
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_subscription_audit_logs_company ON subscription_audit_logs(company_id);
CREATE INDEX idx_subscription_audit_logs_created_at ON subscription_audit_logs(created_at DESC);
CREATE INDEX idx_subscription_audit_logs_action ON subscription_audit_logs(action);

-- Enable Row Level Security
ALTER TABLE subscription_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "System admins can view all audit logs" ON subscription_audit_logs FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'system_admin'));

CREATE POLICY "Admins can view own company audit logs" ON subscription_audit_logs FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs" ON subscription_audit_logs FOR INSERT 
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE subscription_audit_logs IS 'Audit trail for subscription lifecycle changes';
