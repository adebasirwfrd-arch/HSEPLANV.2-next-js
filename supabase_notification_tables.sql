-- =====================================================
-- NOTIFICATION TABLES - Supabase SQL
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. NOTIFICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL CHECK (item_type IN ('otp', 'matrix', 'task')),
    item_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    days_until_due INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'both')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_email);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON notification_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service insert" ON notification_logs
    FOR INSERT WITH CHECK (true);

-- 2. CRON LOGS TABLE
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    total_alerts INTEGER DEFAULT 0,
    sent INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_cron_logs_executed ON cron_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_cron_logs_job ON cron_logs(job_name);

ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON cron_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service insert" ON cron_logs
    FOR INSERT WITH CHECK (true);

-- 3. USER SETTINGS TABLE (for notification preferences)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_name TEXT,
    email_notifications BOOLEAN DEFAULT TRUE,
    whatsapp_notifications BOOLEAN DEFAULT FALSE,
    whatsapp_number TEXT,
    calendar_sync_enabled BOOLEAN DEFAULT FALSE,
    google_calendar_id TEXT,
    notification_time TEXT DEFAULT '08:00',
    timezone TEXT DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_email ON user_settings(email);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Simple policies - allow all authenticated users to manage their own settings
CREATE POLICY "Allow authenticated read" ON user_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON user_settings
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON user_settings
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON user_settings
    FOR DELETE TO authenticated USING (true);


-- 4. CREATE TRIGGER for updated_at on user_settings
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_settings_timestamp ON user_settings;
CREATE TRIGGER update_user_settings_timestamp
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- 5. ADD pic_email AND pic_name TO master_programs IF NOT EXISTS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'master_programs' AND column_name = 'pic_email'
    ) THEN
        ALTER TABLE master_programs ADD COLUMN pic_email TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'master_programs' AND column_name = 'pic_name'
    ) THEN
        ALTER TABLE master_programs ADD COLUMN pic_name TEXT;
    END IF;
END $$;

-- 6. ADD pic_email AND pic_name TO matrix_programs IF NOT EXISTS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matrix_programs' AND column_name = 'pic_email'
    ) THEN
        ALTER TABLE matrix_programs ADD COLUMN pic_email TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matrix_programs' AND column_name = 'pic_name'
    ) THEN
        ALTER TABLE matrix_programs ADD COLUMN pic_name TEXT;
    END IF;
END $$;

-- Verify tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('notification_logs', 'cron_logs', 'user_settings');
