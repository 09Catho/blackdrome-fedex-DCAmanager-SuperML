-- Initial schema for FedEx DCA Management Platform
-- ====================================================

-- Create custom types
CREATE TYPE user_role AS ENUM ('fedex_admin', 'fedex_agent', 'dca_admin', 'dca_agent');
CREATE TYPE case_status AS ENUM ('NEW', 'VALIDATED', 'ASSIGNED', 'IN_PROGRESS', 'PTP', 'DISPUTE', 'ESCALATED', 'RECOVERED', 'CLOSED');
CREATE TYPE activity_type AS ENUM ('CONTACT_ATTEMPT', 'PTP_CREATED', 'DISPUTE_RAISED', 'NOTE', 'STATUS_UPDATE', 'PAYMENT_LOGGED', 'EVIDENCE_UPLOADED');
CREATE TYPE closure_reason AS ENUM ('RECOVERED', 'WRITE_OFF', 'INVALID', 'DUPLICATE', 'OTHER');

-- ====================================================
-- TABLE: dca (Debt Collection Agencies)
-- ====================================================
CREATE TABLE dca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    region TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================
-- TABLE: profiles (User profiles linked to auth.users)
-- ====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    dca_id UUID NULL REFERENCES dca(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profiles_dca_role_check CHECK (
        (role IN ('fedex_admin', 'fedex_agent') AND dca_id IS NULL) OR
        (role IN ('dca_admin', 'dca_agent') AND dca_id IS NOT NULL)
    )
);

-- ====================================================
-- TABLE: cases (Main case tracking)
-- ====================================================
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_ref TEXT NULL,
    customer_name TEXT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    ageing_days INT NOT NULL DEFAULT 0 CHECK (ageing_days >= 0),
    status case_status NOT NULL DEFAULT 'NEW',
    assigned_dca_id UUID NULL REFERENCES dca(id) ON DELETE SET NULL,
    priority_score NUMERIC(10,4) NULL,
    recovery_prob_30d NUMERIC(6,5) NULL CHECK (recovery_prob_30d >= 0 AND recovery_prob_30d <= 1),
    reason_codes JSONB NULL,
    next_action_due_at TIMESTAMPTZ NULL,
    sla_due_at TIMESTAMPTZ NULL,
    closure_reason closure_reason NULL,
    closed_at TIMESTAMPTZ NULL,
    created_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================
-- TABLE: case_activity (Structured activity log)
-- ====================================================
CREATE TABLE case_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    actor_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    actor_role user_role NOT NULL,
    activity_type activity_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================
-- TABLE: case_audit (Immutable audit trail)
-- ====================================================
CREATE TABLE case_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    actor_user_id UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    before JSONB NULL,
    after JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================
-- TABLE: case_sla (SLA tracking per case)
-- ====================================================
CREATE TABLE case_sla (
    case_id UUID PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE,
    sla_type TEXT NOT NULL DEFAULT 'STANDARD',
    breached BOOLEAN NOT NULL DEFAULT FALSE,
    breached_at TIMESTAMPTZ NULL,
    breach_reason TEXT NULL,
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    escalated_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================
-- TABLE: evidence_files (File metadata for uploaded evidence)
-- ====================================================
CREATE TABLE evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    uploader_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NULL,
    size_bytes BIGINT NULL CHECK (size_bytes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================
-- INDEXES for performance
-- ====================================================
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_assigned_dca ON cases(assigned_dca_id);
CREATE INDEX idx_cases_ageing ON cases(ageing_days DESC);
CREATE INDEX idx_cases_priority ON cases(priority_score DESC NULLS LAST);
CREATE INDEX idx_cases_sla_due ON cases(sla_due_at);
CREATE INDEX idx_cases_next_action_due ON cases(next_action_due_at);
CREATE INDEX idx_case_activity_case_created ON case_activity(case_id, created_at DESC);
CREATE INDEX idx_case_audit_case_created ON case_audit(case_id, created_at DESC);
CREATE INDEX idx_evidence_files_case ON evidence_files(case_id);
CREATE INDEX idx_profiles_dca ON profiles(dca_id);

-- ====================================================
-- TRIGGERS
-- ====================================================

-- Auto-update updated_at on cases
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-insert case_sla when case is created
CREATE OR REPLACE FUNCTION create_case_sla()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO case_sla (case_id, sla_type)
    VALUES (NEW.id, 'STANDARD');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_case_sla
    AFTER INSERT ON cases
    FOR EACH ROW
    EXECUTE FUNCTION create_case_sla();

-- Audit trail on case updates
CREATE OR REPLACE FUNCTION log_case_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO case_audit (case_id, actor_user_id, action, after)
        VALUES (NEW.id, NEW.created_by, 'CASE_CREATED', to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO case_audit (case_id, actor_user_id, action, before, after)
        VALUES (NEW.id, auth.uid(), 'CASE_UPDATED', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_case_audit
    AFTER INSERT OR UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION log_case_audit();

-- ====================================================
-- COMMENTS
-- ====================================================
COMMENT ON TABLE dca IS 'Debt Collection Agencies (DCAs)';
COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE cases IS 'Main case tracking with AI scoring';
COMMENT ON TABLE case_activity IS 'Structured activity log for case updates';
COMMENT ON TABLE case_audit IS 'Immutable audit trail for compliance';
COMMENT ON TABLE case_sla IS 'SLA tracking and breach management';
COMMENT ON TABLE evidence_files IS 'Metadata for uploaded evidence documents';
