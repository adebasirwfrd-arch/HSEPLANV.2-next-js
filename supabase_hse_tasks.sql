-- =====================================================
-- HSE TASKS TABLE - Supabase SQL
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. CREATE TABLE (if not exists)
CREATE TABLE IF NOT EXISTS hse_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    program_id TEXT,
    program_name TEXT,
    status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Completed', 'Not Applicable', 'Delayed')),
    region TEXT DEFAULT 'indonesia',
    base TEXT NOT NULL,
    year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    pic_name TEXT,
    pic_email TEXT,
    implementation_date DATE,
    frequency TEXT,
    wpts_id TEXT,
    has_attachment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES for faster queries
CREATE INDEX IF NOT EXISTS idx_hse_tasks_base ON hse_tasks(base);
CREATE INDEX IF NOT EXISTS idx_hse_tasks_region ON hse_tasks(region);
CREATE INDEX IF NOT EXISTS idx_hse_tasks_status ON hse_tasks(status);
CREATE INDEX IF NOT EXISTS idx_hse_tasks_year ON hse_tasks(year);
CREATE INDEX IF NOT EXISTS idx_hse_tasks_program_id ON hse_tasks(program_id);
CREATE INDEX IF NOT EXISTS idx_hse_tasks_region_base ON hse_tasks(region, base);

-- 3. ENABLE RLS (Row Level Security)
ALTER TABLE hse_tasks ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
CREATE POLICY "Allow public read access" ON hse_tasks
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON hse_tasks
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON hse_tasks
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON hse_tasks
    FOR DELETE TO authenticated USING (true);

-- 5. CREATE FUNCTION to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. CREATE TRIGGER for updated_at
DROP TRIGGER IF EXISTS update_hse_tasks_updated_at ON hse_tasks;
CREATE TRIGGER update_hse_tasks_updated_at
    BEFORE UPDATE ON hse_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. INSERT SAMPLE TASKS DATA
-- These are sample tasks to demonstrate the structure
INSERT INTO hse_tasks (code, title, program_id, program_name, status, region, base, year, pic_name, pic_email, implementation_date, frequency, wpts_id) VALUES
-- Narogong Tasks
('T-NRG-001', 'Q1 Fire Safety Audit', 'matrix_indonesia_narogong_audit_2001', 'Risk Management', 'Upcoming', 'indonesia', 'narogong', 2026, 'Ahmad Rizki', 'ahmad.rizki@company.com', '2026-03-15', 'Quarterly', 'WPTS-2026-001'),
('T-NRG-002', 'Monthly HSE Meeting January', 'matrix_indonesia_narogong_meeting_2169', 'HSE MONTHLY MEETING', 'Completed', 'indonesia', 'narogong', 2026, 'Budi Santoso', 'budi.santoso@company.com', '2026-01-10', 'Monthly', 'WPTS-2026-002'),
('T-NRG-003', 'First Aid Training Session', 'matrix_indonesia_narogong_training_2064', 'First Aid Training - Kemenaker', 'Upcoming', 'indonesia', 'narogong', 2026, 'Dewi Lestari', 'dewi.lestari@company.com', '2026-02-20', 'Annually', 'WPTS-2026-003'),
('T-NRG-004', 'Fire Emergency Drill Q1', 'matrix_indonesia_narogong_drill_2145', 'FIRE EMERGENCY', 'Upcoming', 'indonesia', 'narogong', 2026, 'Eko Prasetyo', 'eko.prasetyo@company.com', '2026-03-01', 'Quarterly', 'WPTS-2026-004'),
('T-NRG-005', 'Driver Performance Review', 'otp_indonesia_narogong_1', 'Provide weekly Driver driving performance report', 'Upcoming', 'indonesia', 'narogong', 2026, 'Faisal Rahman', 'faisal.rahman@company.com', '2026-01-15', 'Monthly', 'WPTS-2026-005'),

-- Balikpapan Tasks
('T-BPP-001', 'Q1 Facility Safety Inspection', 'matrix_indonesia_balikpapan_audit_2023', 'Facility Safety', 'Upcoming', 'indonesia', 'balikpapan', 2026, 'Gunawan Hidayat', 'gunawan.hidayat@company.com', '2026-03-20', 'Quarterly', 'WPTS-2026-006'),
('T-BPP-002', 'Chemical Spill Drill', 'matrix_indonesia_balikpapan_drill_2154', 'CHEMICAL SPILL', 'Upcoming', 'indonesia', 'balikpapan', 2026, 'Hendra Wijaya', 'hendra.wijaya@company.com', '2026-02-15', 'Quarterly', 'WPTS-2026-007'),
('T-BPP-003', 'P2K3 Meeting February', 'matrix_indonesia_balikpapan_meeting_2178', 'P2K3 MEETING', 'Upcoming', 'indonesia', 'balikpapan', 2026, 'Irfan Hakim', 'irfan.hakim@company.com', '2026-02-05', 'Monthly', 'WPTS-2026-008'),
('T-BPP-004', 'Lifting Equipment Inspection', 'otp_indonesia_balikpapan_40', 'Conduct Lifting gear/accessories inspection', 'Upcoming', 'indonesia', 'balikpapan', 2026, 'Joko Susilo', 'joko.susilo@company.com', '2026-01-25', 'Per Semester', 'WPTS-2026-009'),

-- Duri Tasks
('T-DRI-001', 'Q1 Risk Assessment Review', 'matrix_indonesia_duri_audit_2043', 'Risk Management', 'Upcoming', 'indonesia', 'duri', 2026, 'Kurniawan Putra', 'kurniawan.putra@company.com', '2026-03-10', 'Quarterly', 'WPTS-2026-010'),
('T-DRI-002', 'Safety 101 Training Session', 'matrix_indonesia_duri_training_2125', 'Safety 101 Training and HSE Minimum', 'Upcoming', 'indonesia', 'duri', 2026, 'Lukman Adi', 'lukman.adi@company.com', '2026-02-08', 'Monthly', 'WPTS-2026-011'),
('T-DRI-003', 'H2S Emergency Drill', 'matrix_indonesia_duri_drill_2166', 'H2S', 'Upcoming', 'indonesia', 'duri', 2026, 'Mulyadi Saputra', 'mulyadi.saputra@company.com', '2026-03-05', 'Quarterly', 'WPTS-2026-012'),
('T-DRI-004', 'Contractor Audit PHR', 'otp_indonesia_duri_15', 'Conduct Contractor Audit for High Risk Contractors', 'Upcoming', 'indonesia', 'duri', 2026, 'Nugroho Hari', 'nugroho.hari@company.com', '2026-04-15', 'Annually', 'WPTS-2026-013'),

-- Asia Tasks
('T-ASI-001', 'EIP and Reduction Plan Review', 'otp_asia_all_1', 'EIP and reduction plan', 'Upcoming', 'asia', 'all', 2026, 'Oscar Tanaka', 'oscar.tanaka@company.com', '2026-02-14', 'Monthly', 'WPTS-2026-014'),
('T-ASI-002', '12 Facility Inspections Q1', 'otp_asia_all_2', '12 Facility Inspections', 'Upcoming', 'asia', 'all', 2026, 'Patrick Lee', 'patrick.lee@company.com', '2026-03-31', 'Monthly', 'WPTS-2026-015'),
('T-ASI-003', 'HSSE Competency Assessment', 'otp_asia_all_7', 'HSSE Competency', 'Upcoming', 'asia', 'all', 2026, 'Quentin Wong', 'quentin.wong@company.com', '2026-06-30', 'Monthly', 'WPTS-2026-016')

ON CONFLICT (code) DO NOTHING;

-- Verify data
SELECT region, base, status, COUNT(*) as count 
FROM hse_tasks 
GROUP BY region, base, status 
ORDER BY region, base, status;

-- =====================================================
-- OPTIONAL: TASK ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES hse_tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON task_attachments
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON task_attachments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON task_attachments
    FOR DELETE TO authenticated USING (true);
