import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Import Data JSON
import otpNarogong from '@/lib/otp_indonesia_narogong.json'
import otpDuri from '@/lib/otp_indonesia_duri.json'
import otpBalikpapan from '@/lib/otp_indonesia_balikpapan.json'
import otpAsia from '@/lib/otp_asia_data.json'

// --- Interfaces ---
interface MonthData {
    plan: number
    actual: number
    wpts_id?: string
    plan_date?: string
    impl_date?: string
    pic_name?: string
    pic_email?: string
}

interface ProgramData {
    id: number
    name: string
    plan_type: string
    due_date: string | null
    months: Record<string, MonthData>
}

interface OTPData {
    year: number
    programs: ProgramData[]
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const

// --- Helper: Process in Batches to avoid Timeout ---
async function processInBatches<T>(
    items: T[],
    batchSize: number,
    fn: (item: T) => Promise<void>
) {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        // Jalankan batch ini secara parallel
        await Promise.all(batch.map(fn));
    }
}

async function seedData(supabase: any, data: OTPData, region: string, base: string) {
    const programs = data.programs;

    // Proses 5 program sekaligus agar cepat tapi tidak membebani database
    await processInBatches(programs, 5, async (program) => {
        // 1. Insert Master Program
        const { data: insertedProgram, error: programError } = await supabase
            .from('master_programs')
            .insert({
                name: program.name, // Pastikan kolom ini 'name' sesuai DB Anda
                program_type: 'otp',
                region,
                base,
                plan_type: program.plan_type,
                due_date: program.due_date
            })
            .select('id')
            .single()

        if (programError) {
            console.error(`Error inserting program ${program.name}:`, programError.message)
            return // Skip program ini jika gagal
        }

        const programId = insertedProgram.id

        // 2. Insert Progress (Parallel untuk 12 bulan)
        const monthInserts = MONTHS.map(month => {
            const monthData = program.months[month] || { plan: 0, actual: 0 }
            return {
                program_id: programId,
                month: month,
                year: data.year,
                plan_value: monthData.plan,
                actual_value: monthData.actual,
                wpts_id: monthData.wpts_id || null,
                plan_date: monthData.plan_date || null,
                impl_date: monthData.impl_date || null,
                pic_name: monthData.pic_name || null,
                pic_email: monthData.pic_email || null,
                status: monthData.actual >= monthData.plan && monthData.plan > 0 ? 'completed' : 'pending'
            }
        })

        // Insert semua bulan sekaligus (Bulk Insert) jauh lebih cepat
        const { error: progressError } = await supabase
            .from('program_progress')
            .insert(monthInserts)

        if (progressError) {
            console.error(`Error inserting months for ${program.name}:`, progressError.message)
        }
    });

    return programs.length
}

export async function POST() {
    try {
        const supabase = await createClient()

        // Opsional: Anda bisa uncomment ini jika ingin otomatis menghapus data lama setiap kali seed
        // TAPI lebih aman lakukan manual 'TRUNCATE' di Supabase SQL Editor agar terkontrol
        // await supabase.from('program_progress').delete().neq('id', 0)
        // await supabase.from('master_programs').delete().neq('id', 0)

        const results = {
            narogong: 0,
            duri: 0,
            balikpapan: 0,
            asia: 0
        }

        console.log('🚀 Starting Turbo Seeding...')

        // Jalankan per Region secara berurutan, tapi isinya parallel
        console.log('Seeding Narogong...')
        results.narogong = await seedData(supabase, otpNarogong as OTPData, 'indonesia', 'narogong')

        console.log('Seeding Duri...')
        results.duri = await seedData(supabase, otpDuri as OTPData, 'indonesia', 'duri')

        console.log('Seeding Balikpapan...')
        results.balikpapan = await seedData(supabase, otpBalikpapan as OTPData, 'indonesia', 'balikpapan')

        console.log('Seeding Asia...')
        results.asia = await seedData(supabase, otpAsia as OTPData, 'asia', 'all')

        return NextResponse.json({
            success: true,
            message: 'OTP Data Seeded Successfully (Turbo Mode)!',
            counts: results
        })
    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}