import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Singleton pattern - only create one client instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Creates a Supabase client for use in Client Components
 * Uses singleton pattern to avoid "Multiple GoTrueClient instances" warning
 * 
 * Usage:
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * 
 * const supabase = createClient()
 * const { data } = await supabase.from('master_programs').select('*')
 * ```
 */
export const createClient = () => {
    if (supabaseClient) {
        return supabaseClient
    }

    supabaseClient = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    return supabaseClient
}
