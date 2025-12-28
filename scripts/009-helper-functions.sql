-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- Phải chạy script này TRƯỚC khi chạy các script khác có dùng RLS
-- ============================================================================

-- Function 1: Lấy Company ID của user hiện tại
CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS UUID AS $$
BEGIN
  -- Lấy company_id từ profiles table dựa trên auth.uid()
  RETURN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_current_company_id IS 'Returns company_id for current authenticated user';

-- Function 2: Lấy Role của user hiện tại
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Lấy role từ profiles table dựa trên auth.uid()
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_current_user_role IS 'Returns role for current authenticated user';

-- Function 3: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'company_admin')
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin IS 'Returns true if current user is admin or company_admin';

-- Function 4: Check if user belongs to a specific company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT company_id = target_company_id
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_belongs_to_company IS 'Returns true if current user belongs to specified company';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Helper Functions Created Successfully!';
  RAISE NOTICE '   - get_current_company_id()';
  RAISE NOTICE '   - get_current_user_role()';
  RAISE NOTICE '   - is_admin()';
  RAISE NOTICE '   - user_belongs_to_company(uuid)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 These functions are used by RLS policies throughout the system';
END $$;
