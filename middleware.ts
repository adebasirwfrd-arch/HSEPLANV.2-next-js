import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders, isMaintenanceMode, isAdminEmail, isIPBlocked } from '@/lib/edge-config'

// =====================================================
// ENTERPRISE MIDDLEWARE - Security, Auth & Edge Config
// =====================================================

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // =====================================================
    // 1. SECURITY HEADERS - Apply to all responses
    // =====================================================
    const securityHeaders = getSecurityHeaders()

    // =====================================================
    // 2. BLOCKED IP CHECK
    // =====================================================
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'

    try {
        if (clientIP !== 'unknown' && await isIPBlocked(clientIP)) {
            return new NextResponse('Access Denied', {
                status: 403,
                headers: securityHeaders
            })
        }
    } catch (e) {
        // Edge Config unavailable, continue without IP check
        console.warn('IP check skipped:', e)
    }

    // =====================================================
    // 3. MAINTENANCE MODE CHECK
    // =====================================================
    const maintenancePage = '/maintenance'
    const isMaintenancePageRequest = pathname === maintenancePage

    try {
        const maintenanceEnabled = await isMaintenanceMode()

        if (maintenanceEnabled && !isMaintenancePageRequest) {
            // Allow static assets and API during maintenance
            if (pathname.startsWith('/_next') || pathname.startsWith('/api/cron')) {
                // Continue to Supabase auth check
            } else {
                // Check if user is admin (admins can bypass maintenance)
                const supabase = createServerClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    {
                        cookies: {
                            getAll() {
                                return request.cookies.getAll()
                            },
                            setAll() { }, // Read-only for this check
                        },
                    }
                )

                const { data: { user } } = await supabase.auth.getUser()

                if (!user || !(await isAdminEmail(user.email || ''))) {
                    const maintenanceUrl = new URL(maintenancePage, request.url)
                    const response = NextResponse.redirect(maintenanceUrl)
                    Object.entries(securityHeaders).forEach(([key, value]) => {
                        response.headers.set(key, value)
                    })
                    return response
                }
            }
        }
    } catch (e) {
        // Edge Config unavailable, continue without maintenance check
        console.warn('Maintenance check skipped:', e)
    }

    // =====================================================
    // 4. SUPABASE AUTH - Session management
    // =====================================================
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Get current session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // =====================================================
    // 5. ROUTE PROTECTION
    // =====================================================

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/auth/callback', '/api/cron', '/maintenance']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // Protected routes that require authentication
    const protectedRoutes = ['/calendar', '/otp', '/matrix', '/tasks', '/hse-programs', '/statistics', '/settings']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // If not logged in and trying to access protected route, redirect to login
    if (!user && (isProtectedRoute || (!isPublicRoute && pathname !== '/'))) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        const response = NextResponse.redirect(loginUrl)
        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
        })
        return response
    }

    // If logged in and on login page, redirect to dashboard
    if (user && pathname === '/login') {
        // Check for redirect parameter
        const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
        const response = NextResponse.redirect(new URL(redirectTo, request.url))
        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
        })
        return response
    }

    // =====================================================
    // 6. APPLY SECURITY HEADERS TO RESPONSE
    // =====================================================
    Object.entries(securityHeaders).forEach(([key, value]) => {
        supabaseResponse.headers.set(key, value)
    })

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|webmanifest)$).*)',
    ],
}
