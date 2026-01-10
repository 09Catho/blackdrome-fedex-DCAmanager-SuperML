-- Row Level Security (RLS) Policies
-- ====================================================
-- CRITICAL: Enforces tenant isolation for DCA users
-- ====================================================

-- ====================================================
-- HELPER FUNCTIONS for RLS
-- ====================================================

-- Check if current user is a FedEx user
CREATE OR REPLACE FUNCTION is_fedex_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('fedex_admin', 'fedex_agent')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's DCA ID (NULL for FedEx users)
CREATE OR REPLACE FUNCTION current_user_dca_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT dca_id FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access a case
CREATE OR REPLACE FUNCTION can_access_case(case_dca_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- FedEx users can access all cases
    IF is_fedex_user() THEN
        RETURN TRUE;
    END IF;
    
    -- DCA users can only access their assigned cases
    RETURN case_dca_id = current_user_dca_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- ENABLE RLS ON ALL TABLES
-- ====================================================

ALTER TABLE dca ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- POLICIES: dca
-- ====================================================

-- FedEx users can view all DCAs
CREATE POLICY "FedEx users can view all DCAs"
    ON dca FOR SELECT
    USING (is_fedex_user());

-- DCA users can view their own DCA
CREATE POLICY "DCA users can view their own DCA"
    ON dca FOR SELECT
    USING (id = current_user_dca_id());

-- Only FedEx admins can insert/update/delete DCAs
CREATE POLICY "FedEx admins can manage DCAs"
    ON dca FOR ALL
    USING (current_user_role() = 'fedex_admin');

-- ====================================================
-- POLICIES: profiles
-- ====================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- FedEx admins can view all profiles
CREATE POLICY "FedEx admins can view all profiles"
    ON profiles FOR SELECT
    USING (current_user_role() = 'fedex_admin');

-- FedEx admins can insert profiles
CREATE POLICY "FedEx admins can create profiles"
    ON profiles FOR INSERT
    WITH CHECK (current_user_role() = 'fedex_admin');

-- DCA admins can view profiles from their DCA
CREATE POLICY "DCA admins can view their DCA profiles"
    ON profiles FOR SELECT
    USING (
        current_user_role() = 'dca_admin'
        AND dca_id = current_user_dca_id()
    );

-- ====================================================
-- POLICIES: cases
-- ====================================================

-- FedEx users can view all cases
CREATE POLICY "FedEx users can view all cases"
    ON cases FOR SELECT
    USING (is_fedex_user());

-- DCA users can view cases assigned to their DCA
CREATE POLICY "DCA users can view their assigned cases"
    ON cases FOR SELECT
    USING (
        NOT is_fedex_user()
        AND assigned_dca_id = current_user_dca_id()
    );

-- FedEx users can insert cases
CREATE POLICY "FedEx users can create cases"
    ON cases FOR INSERT
    WITH CHECK (is_fedex_user());

-- FedEx users can update cases
CREATE POLICY "FedEx users can update cases"
    ON cases FOR UPDATE
    USING (is_fedex_user())
    WITH CHECK (is_fedex_user());

-- FedEx users can delete cases (soft delete preferred)
CREATE POLICY "FedEx users can delete cases"
    ON cases FOR DELETE
    USING (is_fedex_user());

-- Note: DCA users should NOT update cases directly
-- Updates must go through Edge Functions using service role

-- ====================================================
-- POLICIES: case_activity
-- ====================================================

-- Users can view activities for cases they can access
CREATE POLICY "Users can view activities for accessible cases"
    ON case_activity FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = case_activity.case_id
            AND can_access_case(cases.assigned_dca_id)
        )
    );

-- Users can insert activities for cases they can access
CREATE POLICY "Users can create activities for accessible cases"
    ON case_activity FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = case_activity.case_id
            AND can_access_case(cases.assigned_dca_id)
        )
    );

-- ====================================================
-- POLICIES: case_audit
-- ====================================================

-- FedEx users can view all audit logs
CREATE POLICY "FedEx users can view all audit logs"
    ON case_audit FOR SELECT
    USING (is_fedex_user());

-- DCA users can view audit logs for their cases
CREATE POLICY "DCA users can view their case audit logs"
    ON case_audit FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = case_audit.case_id
            AND assigned_dca_id = current_user_dca_id()
        )
    );

-- Audit inserts are handled by triggers (no direct insert policy needed)

-- ====================================================
-- POLICIES: case_sla
-- ====================================================

-- Users can view SLA for cases they can access
CREATE POLICY "Users can view SLA for accessible cases"
    ON case_sla FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = case_sla.case_id
            AND can_access_case(cases.assigned_dca_id)
        )
    );

-- Only FedEx users can update SLA (or via Edge Functions)
CREATE POLICY "FedEx users can update SLA"
    ON case_sla FOR UPDATE
    USING (is_fedex_user())
    WITH CHECK (is_fedex_user());

-- ====================================================
-- POLICIES: evidence_files
-- ====================================================

-- Users can view evidence for cases they can access
CREATE POLICY "Users can view evidence for accessible cases"
    ON evidence_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = evidence_files.case_id
            AND can_access_case(cases.assigned_dca_id)
        )
    );

-- Users can upload evidence for cases they can access
CREATE POLICY "Users can upload evidence for accessible cases"
    ON evidence_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = evidence_files.case_id
            AND can_access_case(cases.assigned_dca_id)
        )
    );

-- ====================================================
-- STORAGE POLICIES (for evidence bucket)
-- ====================================================

-- Note: Supabase Storage bucket policies should be configured via dashboard or API
-- Bucket name: 'evidence'
-- Policy: Users can upload/read files for cases they can access
-- Path structure: {case_id}/{file_id}_{original_name}

-- ====================================================
-- GRANT PERMISSIONS
-- ====================================================

-- Grant usage on custom types
GRANT USAGE ON TYPE user_role TO authenticated;
GRANT USAGE ON TYPE case_status TO authenticated;
GRANT USAGE ON TYPE activity_type TO authenticated;
GRANT USAGE ON TYPE closure_reason TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION is_fedex_user() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_dca_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_case(UUID) TO authenticated;

-- ====================================================
-- COMMENTS
-- ====================================================

COMMENT ON FUNCTION is_fedex_user() IS 'Returns TRUE if current user is a FedEx admin or agent';
COMMENT ON FUNCTION current_user_dca_id() IS 'Returns DCA ID of current user, NULL for FedEx users';
COMMENT ON FUNCTION current_user_role() IS 'Returns role of current user';
COMMENT ON FUNCTION can_access_case(UUID) IS 'Returns TRUE if current user can access a case with given DCA ID';
