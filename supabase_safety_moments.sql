-- =====================================================
-- SAFETY MOMENTS SYSTEM - Supabase SQL
-- Run this in Supabase SQL Editor
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
    -- Format: [{"type": "image", "url": "https://..."}, {"type": "video", "url": "https://..."}]
    
    -- Thumbnail for gallery display
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
    
    -- Ensure unique user interaction per type
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
    
    -- Content
    content TEXT NOT NULL,
    
    -- Reply to another comment (for nested comments)
    parent_id UUID REFERENCES safety_moment_comments(id) ON DELETE CASCADE,
    
    -- Stats
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
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE safety_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_moment_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_moment_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
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

-- SAFETY_MOMENTS POLICIES

-- Everyone can read non-archived moments
CREATE POLICY "Public can view moments" ON safety_moments
    FOR SELECT USING (is_archived = FALSE);

-- Admin can read all moments (including archived)
CREATE POLICY "Admin can view all moments" ON safety_moments
    FOR SELECT TO authenticated USING (is_admin());

-- Only admin can create moments
CREATE POLICY "Admin can create moments" ON safety_moments
    FOR INSERT TO authenticated WITH CHECK (is_admin());

-- Only admin can update moments
CREATE POLICY "Admin can update moments" ON safety_moments
    FOR UPDATE TO authenticated USING (is_admin());

-- Only admin can delete moments
CREATE POLICY "Admin can delete moments" ON safety_moments
    FOR DELETE TO authenticated USING (is_admin());

-- SAFETY_MOMENT_INTERACTIONS POLICIES

-- Authenticated users can read all interactions
CREATE POLICY "Authenticated can view interactions" ON safety_moment_interactions
    FOR SELECT TO authenticated USING (TRUE);

-- Authenticated users can create their own interactions
CREATE POLICY "Authenticated can create interactions" ON safety_moment_interactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interactions (unlike/unsave)
CREATE POLICY "Users can delete own interactions" ON safety_moment_interactions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SAFETY_MOMENT_COMMENTS POLICIES

-- Everyone can read comments
CREATE POLICY "Public can view comments" ON safety_moment_comments
    FOR SELECT USING (TRUE);

-- Authenticated users can create comments
CREATE POLICY "Authenticated can create comments" ON safety_moment_comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON safety_moment_comments
    FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- Users can delete their own comments, admin can delete any
CREATE POLICY "Users can delete own comments" ON safety_moment_comments
    FOR DELETE TO authenticated USING (auth.uid() = author_id OR is_admin());

-- =====================================================
-- TRIGGERS FOR UPDATED_AT AND STATS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_safety_moments_timestamp
    BEFORE UPDATE ON safety_moments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

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

CREATE TRIGGER update_moment_comments_count
    AFTER INSERT OR DELETE ON safety_moment_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_moment_comments_count();

-- =====================================================
-- REALTIME SUBSCRIPTION
-- =====================================================

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE safety_moments;
ALTER PUBLICATION supabase_realtime ADD TABLE safety_moment_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE safety_moment_comments;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample safety moments (run after an admin user exists)
-- INSERT INTO safety_moments (author_id, author_name, author_avatar, author_role, title, content, category, thumbnail_url, is_featured)
-- SELECT 
--     id,
--     'HSE Admin',
--     NULL,
--     'HSE Manager',
--     'PPE Compliance Check',
--     'Team conducting morning PPE inspection before field work. All team members wearing proper safety equipment.',
--     'Personal Safety',
--     'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
--     TRUE
-- FROM auth.users 
-- WHERE email = 'ade.basirwfrd@gmail.com'
-- LIMIT 1;

-- Verify tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'safety_moment%';
