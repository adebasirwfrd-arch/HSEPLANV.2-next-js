// CRON Job: Process HSE Reminders for Tasks and Programs
// Endpoint: /api/cron/reminders
// Schedule: Daily at 08:00 (configure via Vercel Cron or external service)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    processMultipleAlerts,
    HSEAlertData,
    calculateDaysUntilDue,
    shouldSendReminder,
    getUserNotificationPreferences
} from '@/lib/notification-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Cron secret for security (set in Vercel env)
const CRON_SECRET = process.env.CRON_SECRET || ''

export async function GET(request: NextRequest) {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const alerts: HSEAlertData[] = []
    const today = new Date().toISOString().split('T')[0]

    try {
        // ============================================
        // 1. FETCH TASKS with status 'Upcoming' or 'In Progress'
        // ============================================
        const { data: tasks, error: tasksError } = await supabase
            .from('hse_tasks')
            .select('*')
            .in('status', ['Upcoming', 'In Progress'])
            .not('implementation_date', 'is', null)

        if (tasksError) {
            console.error('Error fetching tasks:', tasksError)
        } else if (tasks) {
            for (const task of tasks) {
                if (!task.implementation_date || !task.pic_email) continue

                const daysUntilDue = calculateDaysUntilDue(task.implementation_date)

                // Only process if within 30 days and should send reminder
                if (daysUntilDue >= 0 && daysUntilDue <= 30) {
                    const frequency = task.frequency || 'monthly'

                    if (shouldSendReminder(daysUntilDue, frequency)) {
                        // Check user preferences
                        const prefs = await getUserNotificationPreferences(task.pic_email)

                        if (!prefs || prefs.emailEnabled) {
                            alerts.push({
                                itemName: task.title,
                                picEmail: task.pic_email,
                                picName: task.pic_name || 'Team Member',
                                planDate: task.implementation_date,
                                frequency: frequency,
                                itemType: 'task',
                                programName: task.program_name || undefined,
                                taskId: task.id,
                                base: task.base,
                                region: task.region
                            })
                        }
                    }
                }
            }
        }

        // ============================================
        // 2. FETCH PROGRAM PROGRESS (plan_date from program_progress table)
        // This fetches monthly entries that have plan_date and pic_email set
        // ============================================
        const { data: programProgress, error: progressError } = await supabase
            .from('program_progress')
            .select(`
                id,
                program_id,
                month,
                year,
                plan_date,
                pic_email,
                pic_name,
                plan_value,
                actual_value,
                master_programs!inner(
                    id, name, plan_type, program_type, base, region
                )
            `)
            .not('plan_date', 'is', null)
            .not('pic_email', 'is', null)

        if (progressError) {
            console.error('Error fetching program progress:', progressError)
        } else if (programProgress) {
            console.log(`Found ${programProgress.length} program progress entries with plan_date`)

            for (const prog of programProgress) {
                if (!prog.plan_date || !prog.pic_email) continue

                const daysUntilDue = calculateDaysUntilDue(prog.plan_date)
                const parentProgram = prog.master_programs as any
                const programType = parentProgram?.program_type || 'otp'
                const frequency = parentProgram?.plan_type || 'Monthly'

                // Only process if within 30 days
                if (daysUntilDue >= 0 && daysUntilDue <= 30) {
                    if (shouldSendReminder(daysUntilDue, frequency)) {
                        // Determine item type based on program_type
                        let itemType: 'otp' | 'matrix' | 'task' = 'otp'
                        if (programType.includes('matrix')) {
                            itemType = 'matrix'
                        }

                        alerts.push({
                            itemName: parentProgram?.name || 'HSE Program',
                            picEmail: prog.pic_email,
                            picName: prog.pic_name || 'HSE Team',
                            planDate: prog.plan_date,
                            frequency: frequency,
                            itemType: itemType,
                            base: parentProgram?.base,
                            region: parentProgram?.region
                        })
                    }
                }
            }
        }

        // ============================================
        // 4. PROCESS ALL ALERTS
        // ============================================
        const result = await processMultipleAlerts(alerts)

        // ============================================
        // 5. LOG CRON EXECUTION (optional)
        // ============================================
        try {
            await supabase.from('cron_logs').insert({
                job_name: 'hse_reminders',
                executed_at: new Date().toISOString(),
                total_alerts: result.total,
                sent: result.sent,
                skipped: result.skipped,
                failed: result.failed
            })
        } catch (e) {
            console.error('Failed to log cron execution:', e)
        }

        return NextResponse.json({
            success: true,
            date: today,
            summary: {
                totalAlerts: result.total,
                emailsSent: result.sent,
                skipped: result.skipped,
                failed: result.failed
            },
            breakdown: {
                tasks: alerts.filter(a => a.itemType === 'task').length,
                otp: alerts.filter(a => a.itemType === 'otp').length,
                matrix: alerts.filter(a => a.itemType === 'matrix').length
            }
        })

    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}

// POST handler for manual trigger (with body containing test data)
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { testEmail, testMode } = body

        if (testMode && testEmail) {
            // Send a test reminder
            const testAlert: HSEAlertData = {
                itemName: 'Test HSE Program',
                picEmail: testEmail,
                picName: 'Test User',
                planDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
                frequency: 'Monthly',
                itemType: 'task',
                programName: 'Test Program',
                taskId: 'test-task-id',
                base: 'narogong',
                region: 'indonesia'
            }

            const result = await processMultipleAlerts([testAlert])

            return NextResponse.json({
                success: true,
                testMode: true,
                result
            })
        }

        // Otherwise, run normal cron
        return GET(request)

    } catch (error) {
        console.error('POST handler error:', error)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
