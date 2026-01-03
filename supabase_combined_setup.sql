-- =====================================================
-- COMBINED SETUP SCRIPT
-- Run this ONCE in Supabase SQL Editor
-- Creates: safety_moments, audit_logs + all triggers
-- =====================================================

-- =====================================================
-- PART 1: SAFETY MOMENTS SYSTEM
-- =====================================================

-- 1. SAFETY MOMENTS TABLE (Main posts)
CREATE TABLE IF NOT EXISTS safety_moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    author_role TEXT DEFAULT 'Team Member',
    
    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General' CHECK (category IN ('General', 'Personal Safety', 'Emergency Response', 'Communication', 'Workplace Safety', 'Near Miss', 'Good Practice', 'Training')),
    
    -- Media (stored as JSON array)
    media JSONB DEFAULT '[]'::jsonb,
    thumbnail_url TEXT,
    
    -- Stats (denormalized for performance)
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    
    -- Metadata
    is_featured BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_moments_author ON safety_moments(author_id);
CREATE INDEX IF NOT EXISTS idx_safety_moments_category ON safety_moments(category);
CREATE INDEX IF NOT EXISTS idx_safety_moments_featured ON safety_moments(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_safety_moments_created ON safety_moments(created_at DESC);

-- 2. SAFETY MOMENT INTERACTIONS TABLE (Likes, Saves)
CREATE TABLE IF NOT EXISTS safety_moment_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moment_id UUID NOT NULL REFERENCES safety_moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'save', 'share')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(moment_id, user_id, interaction_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interactions_moment ON safety_moment_interactions(moment_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON safety_moment_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON safety_moment_interactions(interaction_type);

-- 3. SAFETY MOMENT COMMENTS TABLE
CREATE TABLE IF NOT EXISTS safety_moment_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moment_id UUID NOT NULL REFERENCES safety_moments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES safety_moment_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_moment ON safety_moment_comments(moment_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON safety_moment_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON safety_moment_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON safety_moment_comments(created_at DESC);

-- =====================================================
-- PART 2: AUDIT LOGS SYSTEM
-- =====================================================

-- DROP existing table to recreate with correct schema
DROP TABLE IF EXISTS audit_logs CASCADE;

-- AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    actor_id UUID,
    actor_email TEXT,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_email ON audit_logs(actor_email);

-- =====================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE safety_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_moment_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_moment_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function for admin check
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

-- =====================================================
-- PART 4: RLS POLICIES
-- =====================================================

-- SAFETY_MOMENTS POLICIES
DROP POLICY IF EXISTS "Public can view moments" ON safety_moments;
DROP POLICY IF EXISTS "Admin can view all moments" ON safety_moments;
DROP POLICY IF EXISTS "Admin can create moments" ON safety_moments;
DROP POLICY IF EXISTS "Admin can update moments" ON safety_moments;
DROP POLICY IF EXISTS "Admin can delete moments" ON safety_moments;

CREATE POLICY "Public can view moments" ON safety_moments
    FOR SELECT USING (is_archived = FALSE);
CREATE POLICY "Admin can view all moments" ON safety_moments
    FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin can create moments" ON safety_moments
    FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin can update moments" ON safety_moments
    FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admin can delete moments" ON safety_moments
    FOR DELETE TO authenticated USING (is_admin());

-- SAFETY_MOMENT_INTERACTIONS POLICIES
DROP POLICY IF EXISTS "Authenticated can view interactions" ON safety_moment_interactions;
DROP POLICY IF EXISTS "Authenticated can create interactions" ON safety_moment_interactions;
DROP POLICY IF EXISTS "Users can delete own interactions" ON safety_moment_interactions;

CREATE POLICY "Authenticated can view interactions" ON safety_moment_interactions
    FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated can create interactions" ON safety_moment_interactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON safety_moment_interactions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SAFETY_MOMENT_COMMENTS POLICIES
DROP POLICY IF EXISTS "Public can view comments" ON safety_moment_comments;
DROP POLICY IF EXISTS "Authenticated can create comments" ON safety_moment_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON safety_moment_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON safety_moment_comments;

CREATE POLICY "Public can view comments" ON safety_moment_comments
    FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated can create comments" ON safety_moment_comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON safety_moment_comments
    FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON safety_moment_comments
    FOR DELETE TO authenticated USING (auth.uid() = author_id OR is_admin());

-- AUDIT_LOGS POLICIES
DROP POLICY IF EXISTS "Admin can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Admin can view audit logs" ON audit_logs
    FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- PART 5: TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_safety_moments_timestamp ON safety_moments;
CREATE TRIGGER update_safety_moments_timestamp
    BEFORE UPDATE ON safety_moments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_comments_timestamp ON safety_moment_comments;
CREATE TRIGGER update_comments_timestamp
    BEFORE UPDATE ON safety_moment_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Update moments stats when interactions change
CREATE OR REPLACE FUNCTION update_moment_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.interaction_type = 'like' THEN
            UPDATE safety_moments SET likes_count = likes_count + 1 WHERE id = NEW.moment_id;
        ELSIF NEW.interaction_type = 'save' THEN
            UPDATE safety_moments SET saves_count = saves_count + 1 WHERE id = NEW.moment_id;
        ELSIF NEW.interaction_type = 'share' THEN
            UPDATE safety_moments SET shares_count = shares_count + 1 WHERE id = NEW.moment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.interaction_type = 'like' THEN
            UPDATE safety_moments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.moment_id;
        ELSIF OLD.interaction_type = 'save' THEN
            UPDATE safety_moments SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.moment_id;
        ELSIF OLD.interaction_type = 'share' THEN
            UPDATE safety_moments SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.moment_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_moment_stats_on_interaction ON safety_moment_interactions;
CREATE TRIGGER update_moment_stats_on_interaction
    AFTER INSERT OR DELETE ON safety_moment_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_moment_stats();

-- Update comments count when comments change
CREATE OR REPLACE FUNCTION update_moment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE safety_moments SET comments_count = comments_count + 1 WHERE id = NEW.moment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE safety_moments SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.moment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_moment_comments_count ON safety_moment_comments;
CREATE TRIGGER update_moment_comments_count
    AFTER INSERT OR DELETE ON safety_moment_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_moment_comments_count();

-- =====================================================
-- PART 6: AUDIT LOG FUNCTION AND TRIGGERS
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
    v_actor_id := auth.uid();
    v_actor_email := auth.jwt() ->> 'email';
    
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
    
    INSERT INTO audit_logs (
        action, entity_type, entity_id, actor_id, actor_email,
        description, old_values, new_values
    ) VALUES (
        TG_OP, TG_TABLE_NAME, v_entity_id, v_actor_id, v_actor_email,
        v_description, v_old_values, v_new_values
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers to tables
DO $$
BEGIN
    -- Safety Moments
    DROP TRIGGER IF EXISTS audit_safety_moments ON safety_moments;
    CREATE TRIGGER audit_safety_moments
        AFTER INSERT OR UPDATE OR DELETE ON safety_moments
        FOR EACH ROW
        EXECUTE FUNCTION process_audit_log();
        
    -- Safety Moment Interactions
    DROP TRIGGER IF EXISTS audit_safety_moment_interactions ON safety_moment_interactions;
    CREATE TRIGGER audit_safety_moment_interactions
        AFTER INSERT OR UPDATE OR DELETE ON safety_moment_interactions
        FOR EACH ROW
        EXECUTE FUNCTION process_audit_log();
        
    -- Safety Moment Comments
    DROP TRIGGER IF EXISTS audit_safety_moment_comments ON safety_moment_comments;
    CREATE TRIGGER audit_safety_moment_comments
        AFTER INSERT OR UPDATE OR DELETE ON safety_moment_comments
        FOR EACH ROW
        EXECUTE FUNCTION process_audit_log();
END $$;

-- Also attach to other tables IF they exist
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

-- =====================================================
-- PART 7: ENABLE REALTIME
-- =====================================================

-- Enable realtime (ignore if already added)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE safety_moments;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Already added
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE safety_moment_interactions;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE safety_moment_comments;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'safety_moments', 
    'safety_moment_interactions', 
    'safety_moment_comments', 
    'audit_logs'
)
ORDER BY tablename;
