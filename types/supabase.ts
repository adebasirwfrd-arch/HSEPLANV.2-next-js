/**
 * Supabase Database Type Definitions
 * Auto-generated from HSE Management System SQL Schema
 * 
 * Usage: Import these types in your components and stores
 * import type { Profile, MasterProgram, ProgramProgress } from '@/types/supabase'
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type UserRole = 'admin' | 'manager' | 'viewer'

export type ProgramType =
    | 'otp'
    | 'matrix_audit'
    | 'matrix_training'
    | 'matrix_drill'
    | 'matrix_meeting'

export type ProgressStatus =
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'overdue'
    | 'cancelled'

export type Month =
    | 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun'
    | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec'

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

// ============================================================================
// Database Table Types
// ============================================================================

/**
 * Profile extends auth.users with HSE-specific fields
 */
export interface Profile {
    id: string // UUID from auth.users
    email: string
    full_name: string | null
    role: UserRole
    region: string
    base: string
    created_at: string // ISO timestamp
    updated_at: string // ISO timestamp
}

/**
 * Master Programs - Centralized table for OTP & Matrix programs
 */
export interface MasterProgram {
    id: number // bigint
    title: string
    program_type: ProgramType
    region: string
    base: string
    plan_type: string | null
    reference_doc: string | null
    due_date: string | null // ISO date
    created_at: string // ISO timestamp
    updated_at: string // ISO timestamp
}

/**
 * Program Progress - Monthly tracking data for each program
 */
export interface ProgramProgress {
    id: number // bigint
    program_id: number // Foreign key to master_programs
    month: Month
    year: number
    plan_value: number
    actual_value: number
    wpts_id: string | null
    plan_date: string | null // ISO date
    impl_date: string | null // ISO date
    pic_name: string | null
    pic_email: string | null
    pic_manager: string | null
    pic_manager_email: string | null
    evidence_url: string | null
    status: ProgressStatus
    notes: string | null
    last_updated: string // ISO timestamp
    updated_by: string | null // UUID
}

/**
 * Audit Logs - Enterprise compliance tracking
 * Note: Only accessible by admin users
 */
export interface AuditLog {
    id: number // bigint
    user_id: string | null // UUID
    user_email: string | null
    action: AuditAction
    target_table: string
    target_id: number | null
    description: string | null
    old_values: Record<string, unknown> | null // JSONB
    new_values: Record<string, unknown> | null // JSONB
    ip_address: string | null
    user_agent: string | null
    created_at: string // ISO timestamp
}

// ============================================================================
// View & Function Return Types
// ============================================================================

/**
 * Program Summary View - Aggregated progress data
 */
export interface ProgramSummary {
    id: number
    title: string
    program_type: ProgramType
    region: string
    base: string
    plan_type: string | null
    reference_doc: string | null
    due_date: string | null
    total_plan: number
    total_actual: number
    progress_percent: number
    year: number
}

/**
 * Calendar Event - Returned by get_calendar_events function
 */
export interface CalendarEvent {
    program_id: number
    program_title: string
    program_type: ProgramType
    region: string
    base: string
    month: Month
    plan_date: string | null
    impl_date: string | null
    pic_name: string | null
    plan_value: number
    actual_value: number
    status: ProgressStatus
}

// ============================================================================
// Insert/Update Types (for mutations)
// ============================================================================

export type MasterProgramInsert = Omit<MasterProgram, 'id' | 'created_at' | 'updated_at'>
export type MasterProgramUpdate = Partial<MasterProgramInsert>

export type ProgramProgressInsert = Omit<ProgramProgress, 'id' | 'last_updated' | 'updated_by'>
export type ProgramProgressUpdate = Partial<Omit<ProgramProgressInsert, 'program_id' | 'month' | 'year'>>

export type ProfileUpdate = Partial<Pick<Profile, 'full_name' | 'role' | 'region' | 'base'>>

// ============================================================================
// Supabase Database Type (for client typing)
// ============================================================================

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: Omit<Profile, 'created_at' | 'updated_at'>
                Update: ProfileUpdate
            }
            master_programs: {
                Row: MasterProgram
                Insert: MasterProgramInsert
                Update: MasterProgramUpdate
            }
            program_progress: {
                Row: ProgramProgress
                Insert: ProgramProgressInsert
                Update: ProgramProgressUpdate
            }
            audit_logs: {
                Row: AuditLog
                Insert: never // Audit logs are insert-only via triggers
                Update: never
            }
        }
        Views: {
            program_summary: {
                Row: ProgramSummary
            }
        }
        Functions: {
            get_calendar_events: {
                Args: { p_year?: number }
                Returns: CalendarEvent[]
            }
        }
    }
}
