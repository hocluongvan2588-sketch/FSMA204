-- Tạo 1 hàm kiểm tra quyền xem Agent (Viết 1 lần dùng nhiều nơi)
CREATE OR REPLACE FUNCTION can_access_agent(agent_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Là Admin hệ thống
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
    OR
    -- Hoặc Agent thuộc về Facility của công ty mình
    agent_id IN (
      SELECT us_agent_id FROM facilities 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Khi đó, các Policy sẽ cực kỳ ngắn gọn:
CREATE POLICY "Manage agents" ON us_agents 
USING (can_access_agent(id));
