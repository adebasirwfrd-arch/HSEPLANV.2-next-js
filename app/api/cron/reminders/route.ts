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
        // 2. FETCH OTP PROGRAMS (master_programs with program_type = 'otp')
        // ============================================
        const { data: otpPrograms, error: otpError } = await supabase
            .from('master_programs')
            .select('*')
            .eq('program_type', 'otp')
            .not('due_date', 'is', null)

        if (otpError) {
            console.error('Error fetching OTP programs:', otpError)
        } else if (otpPrograms) {
            for (const prog of otpPrograms) {
                if (!prog.due_date) continue

                const daysUntilDue = calculateDaysUntilDue(prog.due_date)

                if (daysUntilDue >= 0 && daysUntilDue <= 30) {
                    const frequency = prog.plan_type || 'Monthly'

                    if (shouldSendReminder(daysUntilDue, frequency)) {
                        // For OTP programs without specific PIC, skip or use default
                        // In production, you'd join with a PIC assignment table
                        // For now, we'll skip programs without email
                        if (prog.pic_email) {
                            alerts.push({
                                itemName: prog.name,
                                picEmail: prog.pic_email,
                                picName: prog.pic_name || 'HSE Team',
                                planDate: prog.due_date,
                                frequency: frequency,
                                itemType: 'otp',
                                base: prog.base,
                                region: prog.region
                            })
                        }
                    }
                }
            }
        }

        // ============================================
        // 3. FETCH MATRIX PROGRAMS
        // ============================================
        const { data: matrixPrograms, error: matrixError } = await supabase
            .from('matrix_programs')
            .select('*')
            .not('due_date', 'is', null)

        if (matrixError) {
            console.error('Error fetching Matrix programs:', matrixError)
        } else if (matrixPrograms) {
            for (const prog of matrixPrograms) {
                if (!prog.due_date) continue

                const daysUntilDue = calculateDaysUntilDue(prog.due_date)

                if (daysUntilDue >= 0 && daysUntilDue <= 30) {
                    const frequency = prog.plan_type || 'Monthly'

                    if (shouldSendReminder(daysUntilDue, frequency)) {
                        if (prog.pic_email) {
                            alerts.push({
                                itemName: prog.name,
                                picEmail: prog.pic_email,
                                picName: prog.pic_name || 'HSE Team',
                                planDate: prog.due_date,
                                frequency: frequency,
                                itemType: 'matrix',
                                base: prog.base,
                                region: prog.region
                            })
                        }
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
