"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Admin email from environment variable (flexible configuration)
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ade.basirwfrd@gmail.com'

interface UseAdminReturn {
    user: User | null
    isAdmin: boolean
    isLoading: boolean
    isAuthenticated: boolean
    signOut: () => Promise<void>
}

export function useAdmin(): UseAdminReturn {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        // Get initial session
        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)
            } catch (error) {
                console.error('Error getting user:', error)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        getUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)
                setIsLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, []) // Empty deps - supabase is now a singleton

    const signOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setUser(null)
    }

    const isAdmin = user?.email === ADMIN_EMAIL
    const isAuthenticated = !!user

    return {
        user,
        isAdmin,
        isLoading,
        isAuthenticated,
        signOut
    }
}
