import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Handle OAuth error
    if (error) {
        console.error('OAuth error:', error, error_description)
        const loginUrl = new URL('/login', requestUrl.origin)
        loginUrl.searchParams.set('error', error_description || error)
        return NextResponse.redirect(loginUrl)
    }

    // Exchange code for session
    if (code) {
        try {
            const supabase = await createClient()
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                console.error('Session exchange error:', exchangeError)
                const loginUrl = new URL('/login', requestUrl.origin)
                loginUrl.searchParams.set('error', exchangeError.message)
                return NextResponse.redirect(loginUrl)
            }
        } catch (err) {
            console.error('Unexpected error during auth:', err)
            const loginUrl = new URL('/login', requestUrl.origin)
            loginUrl.searchParams.set('error', 'Authentication failed')
            return NextResponse.redirect(loginUrl)
        }
    }

    // Redirect to dashboard after successful auth
    return NextResponse.redirect(new URL('/', requestUrl.origin))
}
