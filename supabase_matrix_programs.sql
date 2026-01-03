-- =====================================================
-- MATRIX PROGRAMS TABLE - Supabase SQL
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. CREATE TABLE (if not exists)
CREATE TABLE IF NOT EXISTS matrix_programs (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    program_type TEXT DEFAULT 'matrix',
    region TEXT DEFAULT 'indonesia',
    base TEXT NOT NULL,
    category TEXT NOT NULL,
    plan_type TEXT,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reference_doc TEXT
);

-- 2. CREATE INDEX for faster queries
CREATE INDEX IF NOT EXISTS idx_matrix_programs_base ON matrix_programs(base);
CREATE INDEX IF NOT EXISTS idx_matrix_programs_category ON matrix_programs(category);
CREATE INDEX IF NOT EXISTS idx_matrix_programs_region_base ON matrix_programs(region, base);

-- 3. ENABLE RLS (Row Level Security)
ALTER TABLE matrix_programs ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICY (allow all authenticated users to read)
CREATE POLICY "Allow public read access" ON matrix_programs
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON matrix_programs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON matrix_programs
    FOR UPDATE TO authenticated USING (true);

-- 5. INSERT MATRIX PROGRAMS DATA
-- Audit - Narogong (21 programs)
INSERT INTO matrix_programs (id, name, program_type, region, base, category, plan_type, created_at, reference_doc) VALUES
(2001, 'Risk Management', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2002, 'Facility Safety', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2003, 'Commitment & Intervention', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2004, 'Hazardous Substance', 'matrix', 'indonesia', 'narogong', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2005, 'Hazardous Environments', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2006, 'Incident Management', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2007, 'Driver and Vehicle Procedure', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2008, 'Occupational Health Procedure', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2009, 'Lifting Equipment and Operation', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2010, 'Employee and Contractor HSSE Training', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2011, 'Management of Short Service Employees', 'matrix', 'indonesia', 'narogong', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2012, 'Facility Orientation and Induction', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2013, 'Personnel Protective Equipment (PPE)', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2014, 'Contractor Management', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2015, 'Global Radiation Protection', 'matrix', 'indonesia', 'narogong', 'audit', 'Annually', NOW(), 'IOGP CLSR and ISO 45001'),
(2016, 'Lone Worker', 'matrix', 'indonesia', 'narogong', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2017, 'Waste Management', 'matrix', 'indonesia', 'narogong', 'audit', 'Annually', NOW(), 'IOGP CLSR and ISO 14001'),
(2018, 'Water Management', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 14001'),
(2019, 'Land Impact Management', 'matrix', 'indonesia', 'narogong', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 14001'),
(2020, 'QMS Audit (Internal)', 'matrix', 'indonesia', 'narogong', 'audit', 'Monthly', NOW(), 'QMS and ISO 9001'),
(2021, 'ISO External Audit', 'matrix', 'indonesia', 'narogong', 'audit', 'Annually', NOW(), 'ISO 9001; 14001 & 45001'),

-- Audit - Balikpapan (21 programs)
(2022, 'Risk Management', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2023, 'Facility Safety', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2024, 'Commitment & Intervention', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2025, 'Hazardous Substance', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2026, 'Hazardous Environments', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2027, 'Incident Management', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2028, 'Driver and Vehicle Procedure', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2029, 'Occupational Health Procedure', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2030, 'Lifting Equipment and Operation', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2031, 'Employee and Contractor HSSE Training', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2032, 'Management of Short Service Employees', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2033, 'Facility Orientation and Induction', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2034, 'Personnel Protective Equipment (PPE)', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2035, 'Contractor Management', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2036, 'Global Radiation Protection', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Annually', NOW(), 'IOGP CLSR and ISO 45001'),
(2037, 'Lone Worker', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2038, 'Waste Management', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Annually', NOW(), 'IOGP CLSR and ISO 14001'),
(2039, 'Water Management', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 14001'),
(2040, 'Land Impact Management', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 14001'),
(2041, 'QMS Audit (Internal)', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Monthly', NOW(), 'QMS and ISO 9001'),
(2042, 'ISO External Audit', 'matrix', 'indonesia', 'balikpapan', 'audit', 'Annually', NOW(), 'ISO 9001; 14001 & 45001'),

-- Audit - Duri (21 programs)
(2043, 'Risk Management', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2044, 'Facility Safety', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2045, 'Commitment & Intervention', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2046, 'Hazardous Substance', 'matrix', 'indonesia', 'duri', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2047, 'Hazardous Environments', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2048, 'Incident Management', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2049, 'Driver and Vehicle Procedure', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2050, 'Occupational Health Procedure', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2051, 'Lifting Equipment and Operation', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2052, 'Employee and Contractor HSSE Training', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2053, 'Management of Short Service Employees', 'matrix', 'indonesia', 'duri', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2054, 'Facility Orientation and Induction', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2055, 'Personnel Protective Equipment (PPE)', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2056, 'Contractor Management', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 45001'),
(2057, 'Global Radiation Protection', 'matrix', 'indonesia', 'duri', 'audit', 'Annually', NOW(), 'IOGP CLSR and ISO 45001'),
(2058, 'Lone Worker', 'matrix', 'indonesia', 'duri', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 45001'),
(2059, 'Waste Management', 'matrix', 'indonesia', 'duri', 'audit', 'Annually', NOW(), 'IOGP CLSR and ISO 14001'),
(2060, 'Water Management', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'IOGP CLSR and ISO 14001'),
(2061, 'Land Impact Management', 'matrix', 'indonesia', 'duri', 'audit', 'Quarterly', NOW(), 'IOGP CLSR and ISO 14001'),
(2062, 'QMS Audit (Internal)', 'matrix', 'indonesia', 'duri', 'audit', 'Monthly', NOW(), 'QMS and ISO 9001'),
(2063, 'ISO External Audit', 'matrix', 'indonesia', 'duri', 'audit', 'Annually', NOW(), 'ISO 9001; 14001 & 45001'),

-- Training - Narogong (27 programs)
(2064, 'First Aid Training - Kemenaker', 'matrix', 'indonesia', 'narogong', 'training', 'Annually', NOW(), 'Certification'),
(2065, 'Fire Training (DAMKAR D) - Kemenaker', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Certification'),
(2066, 'AK3 Umum Training - Kemenaker', 'matrix', 'indonesia', 'narogong', 'training', 'Annually', NOW(), 'Certification'),
(2067, 'K3 MIGAS Training - BNSP', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Certification'),
(2068, 'POPAL - BNSP', 'matrix', 'indonesia', 'narogong', 'training', 'Quarterly', NOW(), 'Certification'),
(2069, 'PAA Lifting Equipment Operator', 'matrix', 'indonesia', 'narogong', 'training', 'Quarterly', NOW(), 'Certification'),
(2070, 'TKBT 2 - Working At Height Certification', 'matrix', 'indonesia', 'narogong', 'training', 'Quarterly', NOW(), 'Certification'),
(2071, 'Safety 101 Training and HSE Minimum', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2072, 'Safety 201 Training for Supv Level', 'matrix', 'indonesia', 'narogong', 'training', 'Annually', NOW(), 'Training Modules'),
(2073, 'HSE Induction / Orientation for New Employee', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2074, 'Hand & Finger Injury Prevention Campaign', 'matrix', 'indonesia', 'narogong', 'training', 'Annually', NOW(), 'Training Modules'),
(2075, 'Lifting & Rigging Operator Coaching', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2076, 'Basic Fire Safety Training', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2077, 'Hands Off Lifting Campaign', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2078, 'Health Talk by Doctor', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2079, 'Risk Management and SWA Training', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2080, 'Waste Management', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2081, 'DROPS', 'matrix', 'indonesia', 'narogong', 'training', 'Quarterly', NOW(), 'Training Modules'),
(2082, 'Move SMART / Manual Handling', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2083, 'SWC Refreshment Training', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2084, 'H2S Awareness', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2085, 'Motor Vehicle Safety and Commentary Drive', 'matrix', 'indonesia', 'narogong', 'training', 'Annually', NOW(), 'Training Modules'),
(2086, 'Spotter Training (PHR)', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2087, 'RA Awareness', 'matrix', 'indonesia', 'narogong', 'training', 'Quarterly', NOW(), 'Training Modules'),
(2088, 'Lithium Battery Awareness', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2089, 'Lock Out Tag Out (LOTO) Awareness', 'matrix', 'indonesia', 'narogong', 'training', 'Monthly', NOW(), 'Training Modules'),
(2090, 'CLSR', 'matrix', 'indonesia', 'narogong', 'training', 'Quarterly', NOW(), 'Training Modules'),

-- Training - Balikpapan (27 programs)
(2091, 'First Aid Training - Kemenaker', 'matrix', 'indonesia', 'balikpapan', 'training', 'Annually', NOW(), 'Certification'),
(2092, 'Fire Training (DAMKAR D) - Kemenaker', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Certification'),
(2093, 'AK3 Umum Training - Kemenaker', 'matrix', 'indonesia', 'balikpapan', 'training', 'Annually', NOW(), 'Certification'),
(2094, 'K3 MIGAS Training - BNSP', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Certification'),
(2095, 'POPAL - BNSP', 'matrix', 'indonesia', 'balikpapan', 'training', 'Quarterly', NOW(), 'Certification'),
(2096, 'PAA Lifting Equipment Operator', 'matrix', 'indonesia', 'balikpapan', 'training', 'Quarterly', NOW(), 'Certification'),
(2097, 'TKBT 2 - Working At Height Certification', 'matrix', 'indonesia', 'balikpapan', 'training', 'Quarterly', NOW(), 'Certification'),
(2098, 'Safety 101 Training and HSE Minimum', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2099, 'Safety 201 Training for Supv Level', 'matrix', 'indonesia', 'balikpapan', 'training', 'Annually', NOW(), 'Training Modules'),
(2100, 'HSE Induction / Orientation for New Employee', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2101, 'Hand & Finger Injury Prevention Campaign', 'matrix', 'indonesia', 'balikpapan', 'training', 'Annually', NOW(), 'Training Modules'),
(2102, 'Lifting & Rigging Operator Coaching', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2103, 'Basic Fire Safety Training', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2104, 'Hands Off Lifting Campaign', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2105, 'Health Talk by Doctor', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2106, 'Risk Management and SWA Training', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2107, 'Waste Management', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2108, 'DROPS', 'matrix', 'indonesia', 'balikpapan', 'training', 'Quarterly', NOW(), 'Training Modules'),
(2109, 'Move SMART / Manual Handling', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2110, 'SWC Refreshment Training', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2111, 'H2S Awareness', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2112, 'Motor Vehicle Safety and Commentary Drive', 'matrix', 'indonesia', 'balikpapan', 'training', 'Annually', NOW(), 'Training Modules'),
(2113, 'Spotter Training (PHR)', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2114, 'RA Awareness', 'matrix', 'indonesia', 'balikpapan', 'training', 'Quarterly', NOW(), 'Training Modules'),
(2115, 'Lithium Battery Awareness', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2116, 'Lock Out Tag Out (LOTO) Awareness', 'matrix', 'indonesia', 'balikpapan', 'training', 'Monthly', NOW(), 'Training Modules'),
(2117, 'CLSR', 'matrix', 'indonesia', 'balikpapan', 'training', 'Quarterly', NOW(), 'Training Modules'),

-- Training - Duri (27 programs)
(2118, 'First Aid Training - Kemenaker', 'matrix', 'indonesia', 'duri', 'training', 'Annually', NOW(), 'Certification'),
(2119, 'Fire Training (DAMKAR D) - Kemenaker', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Certification'),
(2120, 'AK3 Umum Training - Kemenaker', 'matrix', 'indonesia', 'duri', 'training', 'Annually', NOW(), 'Certification'),
(2121, 'K3 MIGAS Training - BNSP', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Certification'),
(2122, 'POPAL - BNSP', 'matrix', 'indonesia', 'duri', 'training', 'Quarterly', NOW(), 'Certification'),
(2123, 'PAA Lifting Equipment Operator', 'matrix', 'indonesia', 'duri', 'training', 'Quarterly', NOW(), 'Certification'),
(2124, 'TKBT 2 - Working At Height Certification', 'matrix', 'indonesia', 'duri', 'training', 'Quarterly', NOW(), 'Certification'),
(2125, 'Safety 101 Training and HSE Minimum', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2126, 'Safety 201 Training for Supv Level', 'matrix', 'indonesia', 'duri', 'training', 'Annually', NOW(), 'Training Modules'),
(2127, 'HSE Induction / Orientation for New Employee', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2128, 'Hand & Finger Injury Prevention Campaign', 'matrix', 'indonesia', 'duri', 'training', 'Annually', NOW(), 'Training Modules'),
(2129, 'Lifting & Rigging Operator Coaching', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2130, 'Basic Fire Safety Training', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2131, 'Hands Off Lifting Campaign', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2132, 'Health Talk by Doctor', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2133, 'Risk Management and SWA Training', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2134, 'Waste Management', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2135, 'DROPS', 'matrix', 'indonesia', 'duri', 'training', 'Quarterly', NOW(), 'Training Modules'),
(2136, 'Move SMART / Manual Handling', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2137, 'SWC Refreshment Training', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2138, 'H2S Awareness', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2139, 'Motor Vehicle Safety and Commentary Drive', 'matrix', 'indonesia', 'duri', 'training', 'Annually', NOW(), 'Training Modules'),
(2140, 'Spotter Training (PHR)', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2141, 'RA Awareness', 'matrix', 'indonesia', 'duri', 'training', 'Quarterly', NOW(), 'Training Modules'),
(2142, 'Lithium Battery Awareness', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2143, 'Lock Out Tag Out (LOTO) Awareness', 'matrix', 'indonesia', 'duri', 'training', 'Monthly', NOW(), 'Training Modules'),
(2144, 'CLSR', 'matrix', 'indonesia', 'duri', 'training', 'Quarterly', NOW(), 'Training Modules'),

-- Drill - Narogong (8 programs)
(2145, 'FIRE EMERGENCY', 'matrix', 'indonesia', 'narogong', 'drill', 'Monthly', NOW(), ''),
(2146, 'CHEMICAL SPILL', 'matrix', 'indonesia', 'narogong', 'drill', 'Monthly', NOW(), ''),
(2147, 'MEDICAL EMERGENCY', 'matrix', 'indonesia', 'narogong', 'drill', 'Annually', NOW(), ''),
(2148, 'EARTHQUAKE EMERGENCY', 'matrix', 'indonesia', 'narogong', 'drill', 'Monthly', NOW(), ''),
(2149, 'RAM EMERGENCY', 'matrix', 'indonesia', 'narogong', 'drill', 'Monthly', NOW(), ''),
(2150, 'H2S', 'matrix', 'indonesia', 'narogong', 'drill', 'Monthly', NOW(), ''),
(2151, 'Li BATTERY EMERGENCY', 'matrix', 'indonesia', 'narogong', 'drill', 'Monthly', NOW(), ''),
(2152, 'EXPLOSIVE EMERGENCY', 'matrix', 'indonesia', 'narogong', 'drill', 'Monthly', NOW(), ''),

-- Drill - Balikpapan (8 programs)
(2153, 'FIRE EMERGENCY', 'matrix', 'indonesia', 'balikpapan', 'drill', 'Monthly', NOW(), ''),
(2154, 'CHEMICAL SPILL', 'matrix', 'indonesia', 'balikpapan', 'drill', 'Monthly', NOW(), ''),
(2155, 'MEDICAL EMERGENCY', 'matrix', 'indonesia', 'balikpapan', 'drill', 'Annually', NOW(), ''),
(2156, 'EARTHQUAKE EMERGENCY', 'matrix', 'indonesia', 'balikpapan', 'drill', 'Monthly', NOW(), ''),
(2157, 'RAM EMERGENCY', 'matrix', 'indonesia', 'balikpapan', 'drill', 'Monthly', NOW(), ''),
(2158, 'H2S', 'matrix', 'indonesia', 'balikpapan', 'drill', 'Monthly', NOW(), ''),
(2159, 'Li BATTERY EMERGENCY', 'matrix', 'indonesia', 'balikpapan', 'drill', 'Monthly', NOW(), ''),
(2160, 'EXPLOSIVE EMERGENCY', 'matrix', 'indonesia', 'balikpapan', 'drill', 'Monthly', NOW(), ''),

-- Drill - Duri (8 programs)
(2161, 'FIRE EMERGENCY', 'matrix', 'indonesia', 'duri', 'drill', 'Monthly', NOW(), ''),
(2162, 'CHEMICAL SPILL', 'matrix', 'indonesia', 'duri', 'drill', 'Monthly', NOW(), ''),
(2163, 'MEDICAL EMERGENCY', 'matrix', 'indonesia', 'duri', 'drill', 'Annually', NOW(), ''),
(2164, 'EARTHQUAKE EMERGENCY', 'matrix', 'indonesia', 'duri', 'drill', 'Monthly', NOW(), ''),
(2165, 'RAM EMERGENCY', 'matrix', 'indonesia', 'duri', 'drill', 'Monthly', NOW(), ''),
(2166, 'H2S', 'matrix', 'indonesia', 'duri', 'drill', 'Monthly', NOW(), ''),
(2167, 'Li BATTERY EMERGENCY', 'matrix', 'indonesia', 'duri', 'drill', 'Monthly', NOW(), ''),
(2168, 'EXPLOSIVE EMERGENCY', 'matrix', 'indonesia', 'duri', 'drill', 'Monthly', NOW(), ''),

-- Meeting - Narogong (8 programs)
(2169, 'HSE MONTHLY MEETING', 'matrix', 'indonesia', 'narogong', 'meeting', 'Monthly', NOW(), ''),
(2170, 'P2K3 MEETING', 'matrix', 'indonesia', 'narogong', 'meeting', 'Monthly', NOW(), ''),
(2171, 'RISK ASSESSMENT MEETING', 'matrix', 'indonesia', 'narogong', 'meeting', 'Quarterly', NOW(), ''),
(2172, 'LEARNING GROUP DISCUSSION', 'matrix', 'indonesia', 'narogong', 'meeting', 'Monthly', NOW(), ''),
(2173, 'HSE UPDATE MEETING', 'matrix', 'indonesia', 'narogong', 'meeting', 'Monthly', NOW(), ''),
(2174, 'HSE PLAN MEETING', 'matrix', 'indonesia', 'narogong', 'meeting', 'Monthly', NOW(), ''),
(2175, 'HSE PREMOB BRIEFING', 'matrix', 'indonesia', 'narogong', 'meeting', 'Monthly', NOW(), ''),
(2176, 'HSE QUARTERLY PLAN MEETING', 'matrix', 'indonesia', 'narogong', 'meeting', 'Quarterly', NOW(), ''),

-- Meeting - Balikpapan (8 programs)
(2177, 'HSE MONTHLY MEETING', 'matrix', 'indonesia', 'balikpapan', 'meeting', 'Monthly', NOW(), ''),
(2178, 'P2K3 MEETING', 'matrix', 'indonesia', 'balikpapan', 'meeting', 'Monthly', NOW(), ''),
(2179, 'RISK ASSESSMENT MEETING', 'matrix', 'indonesia', 'balikpapan', 'meeting', 'Quarterly', NOW(), ''),
(2180, 'LEARNING GROUP DISCUSSION', 'matrix', 'indonesia', 'balikpapan', 'meeting', 'Monthly', NOW(), ''),
(2181, 'HSE UPDATE MEETING', 'matrix', 'indonesia', 'balikpapan', 'meeting', 'Monthly', NOW(), ''),
(2182, 'HSE PLAN MEETING', 'matrix', 'indonesia', 'balikpapan', 'meeting', 'Monthly', NOW(), ''),
(2183, 'HSE PREMOB BRIEFING', 'matrix', 'indonesia', 'balikpapan', 'meeting', 'Monthly', NOW(), ''),
(2184, 'HSE QUARTERLY PLAN MEETING', 'matrix', 'indonesia', 'balikpapan', 'meeting', 'Quarterly', NOW(), ''),

-- Meeting - Duri (8 programs)
(2185, 'HSE MONTHLY MEETING', 'matrix', 'indonesia', 'duri', 'meeting', 'Monthly', NOW(), ''),
(2186, 'P2K3 MEETING', 'matrix', 'indonesia', 'duri', 'meeting', 'Monthly', NOW(), ''),
(2187, 'RISK ASSESSMENT MEETING', 'matrix', 'indonesia', 'duri', 'meeting', 'Quarterly', NOW(), ''),
(2188, 'LEARNING GROUP DISCUSSION', 'matrix', 'indonesia', 'duri', 'meeting', 'Monthly', NOW(), ''),
(2189, 'HSE UPDATE MEETING', 'matrix', 'indonesia', 'duri', 'meeting', 'Monthly', NOW(), ''),
(2190, 'HSE PLAN MEETING', 'matrix', 'indonesia', 'duri', 'meeting', 'Monthly', NOW(), ''),
(2191, 'HSE PREMOB BRIEFING', 'matrix', 'indonesia', 'duri', 'meeting', 'Monthly', NOW(), ''),
(2192, 'HSE QUARTERLY PLAN MEETING', 'matrix', 'indonesia', 'duri', 'meeting', 'Quarterly', NOW(), '')

ON CONFLICT (id) DO NOTHING;

-- Verify data
SELECT base, category, COUNT(*) as count 
FROM matrix_programs 
GROUP BY base, category 
ORDER BY base, category;
