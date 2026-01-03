-- =====================================================
-- UNIVERSAL AUDIT SYSTEM - Supabase SQL
-- Run this in Supabase SQL Editor AFTER safety_moments tables exist
-- =====================================================

-- DROP existing table to recreate with correct schema
-- WARNING: This will delete existing audit logs!
DROP TABLE IF EXISTS audit_logs CASCADE;

-- 1. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action info
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    entity_type TEXT NOT NULL,  -- e.g., 'tasks', 'programs', 'safety_moments'
    entity_id TEXT,             -- ID of the affected row
    
    -- Actor info
    actor_id UUID,
    actor_email TEXT,
    
    -- Description
    description TEXT,
    
    -- Change data (JSONB for flexibility)
    old_values JSONB,
    new_values JSONB,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_email ON audit_logs(actor_email);

-- =====================================================
-- ROW LEVEL SECURITY - Admin Only
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function for admin check (reuse or create)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT email IN ('ade.basirwfrd@gmail.com')
        FROM auth.users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for re-runs
DROP POLICY IF EXISTS "Admin can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- Only admin can view audit logs
CREATE POLICY "Admin can view audit logs" ON audit_logs
    FOR SELECT TO authenticated USING (is_admin());

-- Allow inserts from triggers (service role)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- UNIVERSAL AUDIT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_actor_email TEXT;
    v_entity_id TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
    v_description TEXT;
BEGIN
    -- Get current user info
    v_actor_id := auth.uid();
    v_actor_email := auth.jwt() ->> 'email';
    
    -- Determine entity_id and values based on operation
    IF TG_OP = 'DELETE' THEN
        v_entity_id := OLD.id::TEXT;
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
        v_description := format('%s deleted from %s', OLD.id, TG_TABLE_NAME);
    ELSIF TG_OP = 'UPDATE' THEN
        v_entity_id := NEW.id::TEXT;
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        v_description := format('%s updated in %s', NEW.id, TG_TABLE_NAME);
    ELSIF TG_OP = 'INSERT' THEN
        v_entity_id := NEW.id::TEXT;
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
        v_description := format('%s created in %s', NEW.id, TG_TABLE_NAME);
    END IF;
    
    -- Insert audit log (using SECURITY DEFINER to bypass RLS)
    INSERT INTO audit_logs (
        action,
        entity_type,
        entity_id,
        actor_id,
        actor_email,
        description,
        old_values,
        new_values
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        v_entity_id,
        v_actor_id,
        v_actor_email,
        v_description,
        v_old_values,
        v_new_values
    );
    
    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ATTACH TRIGGERS TO TABLES
-- =====================================================

-- 1. HSE_TASKS (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hse_tasks') THEN
        DROP TRIGGER IF EXISTS audit_hse_tasks ON hse_tasks;
        CREATE TRIGGER audit_hse_tasks
            AFTER INSERT OR UPDATE OR DELETE ON hse_tasks
            FOR EACH ROW
            EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;

-- 2. MASTER_PROGRAMS (OTP programs)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_programs') THEN
        DROP TRIGGER IF EXISTS audit_master_programs ON master_programs;
        CREATE TRIGGER audit_master_programs
            AFTER INSERT OR UPDATE OR DELETE ON master_programs
            FOR EACH ROW
            EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;

-- 3. MATRIX_PROGRAMS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matrix_programs') THEN
        DROP TRIGGER IF EXISTS audit_matrix_programs ON matrix_programs;
        CREATE TRIGGER audit_matrix_programs
            AFTER INSERT OR UPDATE OR DELETE ON matrix_programs
            FOR EACH ROW
            EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;

-- 3b. PROGRAM_PROGRESS (monthly progress data - critical for task updates!)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_progress') THEN
        DROP TRIGGER IF EXISTS audit_program_progress ON program_progress;
        CREATE TRIGGER audit_program_progress
            AFTER INSERT OR UPDATE OR DELETE ON program_progress
            FOR EACH ROW
            EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;

-- 4. SAFETY_MOMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'safety_moments') THEN
        DROP TRIGGER IF EXISTS audit_safety_moments ON safety_moments;
        CREATE TRIGGER audit_safety_moments
            AFTER INSERT OR UPDATE OR DELETE ON safety_moments
            FOR EACH ROW
            EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;

-- 5. SAFETY_MOMENT_INTERACTIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'safety_moment_interactions') THEN
        DROP TRIGGER IF EXISTS audit_safety_moment_interactions ON safety_moment_interactions;
        CREATE TRIGGER audit_safety_moment_interactions
            AFTER INSERT OR UPDATE OR DELETE ON safety_moment_interactions
            FOR EACH ROW
            EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;

-- 6. SAFETY_MOMENT_COMMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'safety_moment_comments') THEN
        DROP TRIGGER IF EXISTS audit_safety_moment_comments ON safety_moment_comments;
        CREATE TRIGGER audit_safety_moment_comments
            AFTER INSERT OR UPDATE OR DELETE ON safety_moment_comments
            FOR EACH ROW
            EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;

-- 7. USER_SETTINGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        DROP TRIGGER IF EXISTS audit_user_settings ON user_settings;
        CREATE TRIGGER audit_user_settings
            AFTER INSERT OR UPDATE OR DELETE ON user_settings
            FOR EACH ROW
            EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;

-- =====================================================
-- ENABLE REALTIME (Optional)
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all audit triggers
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation as event
FROM information_schema.triggers 
WHERE trigger_name LIKE 'audit_%'
ORDER BY event_object_table;

-- Verify audit_logs table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
