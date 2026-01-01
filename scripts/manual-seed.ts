import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables dari .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERROR: Environment variables hilang. Pastikan .env.local memiliki SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Gunakan client langsung (bypass Next.js)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// Mapping File
const FILES = [
    { region: 'asia', base: 'all', file: 'otp_asia_data.json' },
    { region: 'indonesia', base: 'narogong', file: 'otp_indonesia_narogong.json' },
    { region: 'indonesia', base: 'duri', file: 'otp_indonesia_duri.json' },
    { region: 'indonesia', base: 'balikpapan', file: 'otp_indonesia_balikpapan.json' },
];

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

async function runSeeding() {
    console.log('🚀 MEMULAI MANUAL SEEDING (TERMINAL MODE)...\n');

    // 1. RESET DATABASE
    console.log('🗑️  Menghapus data lama...');
    const { error: err1 } = await supabase.from('program_progress').delete().neq('id', 0);
    const { error: err2 } = await supabase.from('master_programs').delete().neq('id', 0);

    if (err1 || err2) {
        console.error('⚠️  Gagal reset table (Mungkin permission error). Lanjut mencoba insert...');
    } else {
        console.log('✅ Database bersih.');
    }

    // 2. LOOP FILE & INSERT
    for (const item of FILES) {
        const filePath = path.join(process.cwd(), 'lib', item.file);
        console.log(`\n📂 Memproses: ${item.file} (${item.base.toUpperCase()})...`);

        try {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const jsonData = JSON.parse(rawData);
            const programs = jsonData.programs || [];
            const year = jsonData.year || 2026;
            let count = 0;

            // Batch processing per program
            for (const prog of programs) {
                // A. Insert Master
                const { data: master, error: masterErr } = await supabase
                    .from('master_programs')
                    .insert({
                        name: prog.name, // Pastikan kolom ini benar (name/title)
                        program_type: 'otp',
                        region: item.region,
                        base: item.base,
                        plan_type: prog.plan_type,
                        due_date: prog.due_date
                    })
                    .select('id')
                    .single();

                if (masterErr) {
                    console.error(`   ❌ Gagal insert program "${prog.name}": ${masterErr.message}`);
                    continue;
                }

                // B. Insert Progress (12 Bulan)
                const progressData = MONTHS.map(m => {
                    const mData = prog.months?.[m] || { plan: 0, actual: 0 };
                    return {
                        program_id: master.id,
                        year: year,
                        month: m,
                        plan_value: mData.plan,
                        actual_value: mData.actual,
                        status: (mData.actual >= mData.plan && mData.plan > 0) ? 'completed' : 'pending',
                        wpts_id: mData.wpts_id || null,
                        pic_name: mData.pic_name || null
                    };
                });

                const { error: progErr } = await supabase.from('program_progress').insert(progressData);

                if (progErr) {
                    console.error(`   ❌ Gagal insert progress: ${progErr.message}`);
                } else {
                    process.stdout.write('.'); // Progress bar sederhana
                    count++;
                }
            }
            console.log(`\n✅ Selesai ${item.base}: ${count} programs.`);

        } catch (e) {
            console.error(`❌ Gagal membaca file ${item.file}:`, e);
        }
    }

    console.log('\n🎉 SEMUA PROSES SELESAI!');
}

runSeeding();