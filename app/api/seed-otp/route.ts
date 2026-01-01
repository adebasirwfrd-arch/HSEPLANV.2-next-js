import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Import the JSON data
import otpNarogong from '@/lib/otp_indonesia_narogong.json'
import otpDuri from '@/lib/otp_indonesia_duri.json'
import otpBalikpapan from '@/lib/otp_indonesia_balikpapan.json'
import otpAsia from '@/lib/otp_asia_data.json'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedData(supabase: any, data: OTPData, region: string, base: string) {
    const seededPrograms = []

    for (const program of data.programs) {
        // Insert master program
        const { data: insertedProgram, error: programError } = await supabase
            .from('master_programs')
            .insert({
                title: program.name,
                program_type: 'otp',
                region,
                base,
                plan_type: program.plan_type,
                due_date: program.due_date
            })
            .select('id')
            .single()

        if (programError) {
            console.error('Error inserting program:', program.name, programError.message)
            continue
        }

        const programId = insertedProgram.id

        // Insert progress data for each month
        for (const month of MONTHS) {
            const monthData = program.months[month] || { plan: 0, actual: 0 }

            const { error: progressError } = await supabase
                .from('program_progress')
                .insert({
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
                })

            if (progressError) {
                console.error('Error inserting progress for', program.name, month, progressError.message)
            }
        }

        seededPrograms.push({ id: programId, name: program.name })
    }

    return seededPrograms
}

export async function POST() {
    try {
        const supabase = await createClient()

        const results = {
            narogong: [] as { id: number; name: string }[],
            duri: [] as { id: number; name: string }[],
            balikpapan: [] as { id: number; name: string }[],
            asia: [] as { id: number; name: string }[]
        }

        // Seed Indonesia bases
        console.log('Seeding Narogong...')
        results.narogong = await seedData(supabase, otpNarogong as OTPData, 'indonesia', 'narogong')

        console.log('Seeding Duri...')
        results.duri = await seedData(supabase, otpDuri as OTPData, 'indonesia', 'duri')

        console.log('Seeding Balikpapan...')
        results.balikpapan = await seedData(supabase, otpBalikpapan as OTPData, 'indonesia', 'balikpapan')

        // Seed Asia
        console.log('Seeding Asia...')
        results.asia = await seedData(supabase, otpAsia as OTPData, 'asia', 'all')

        return NextResponse.json({
            success: true,
            message: 'OTP data seeded successfully',
            counts: {
                narogong: results.narogong.length,
                duri: results.duri.length,
                balikpapan: results.balikpapan.length,
                asia: results.asia.length,
                total: results.narogong.length + results.duri.length + results.balikpapan.length + results.asia.length
            }
        })
    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'POST to this endpoint to seed OTP data from JSON files to Supabase',
        usage: 'curl -X POST http://localhost:3000/api/seed-otp'
    })
}
