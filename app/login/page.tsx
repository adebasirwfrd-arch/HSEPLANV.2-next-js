"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { gsap } from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [keepLoggedIn, setKeepLoggedIn] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    // Refs for GSAP animations
    const brandingRef = useRef<HTMLDivElement>(null)
    const headlineRef = useRef<HTMLHeadingElement>(null)
    const subtitleRef = useRef<HTMLParagraphElement>(null)
    const descRef = useRef<HTMLParagraphElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const mascotRef = useRef<HTMLDivElement>(null)
    const featuresRef = useRef<HTMLDivElement>(null)

    // Check for error from callback
    useEffect(() => {
        const errorFromUrl = searchParams.get('error')
        if (errorFromUrl) {
            setError(decodeURIComponent(errorFromUrl))
        }
    }, [searchParams])

    // Check if already logged in
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.push('/')
            } else {
                setIsCheckingAuth(false)
            }
        }
        checkAuth()
    }, [router, supabase.auth])

    // GSAP Entrance Animations
    useEffect(() => {
        if (isCheckingAuth) return

        const ctx = gsap.context(() => {
            // Timeline for staggered animations
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

            // Branding side entrance from left
            if (brandingRef.current) {
                gsap.set(brandingRef.current, { opacity: 0, x: -100 })
                tl.to(brandingRef.current, { opacity: 1, x: 0, duration: 1 }, 0)
            }

            // Mascot pop-in with bounce
            if (mascotRef.current) {
                gsap.set(mascotRef.current, { opacity: 0, scale: 0.5, y: 50 })
                tl.to(mascotRef.current, {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'back.out(1.7)'
                }, 0.3)

                // Continuous floating effect
                gsap.to(mascotRef.current, {
                    y: -20,
                    duration: 2.5,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                    delay: 1.5
                })
            }

            // Staggered headline animation
            if (headlineRef.current) {
                gsap.set(headlineRef.current, { opacity: 0, y: 40 })
                tl.to(headlineRef.current, { opacity: 1, y: 0, duration: 0.7 }, 0.5)
            }

            if (subtitleRef.current) {
                gsap.set(subtitleRef.current, { opacity: 0, y: 40 })
                tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.7 }, 0.65)
            }

            if (descRef.current) {
                gsap.set(descRef.current, { opacity: 0, y: 40 })
                tl.to(descRef.current, { opacity: 1, y: 0, duration: 0.7 }, 0.8)
            }

            // Features with stagger
            if (featuresRef.current) {
                const features = featuresRef.current.children
                gsap.set(features, { opacity: 0, y: 20 })
                tl.to(features, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    stagger: 0.1
                }, 1)
            }

            // Card pop-in with spring/bounce effect
            if (cardRef.current) {
                gsap.set(cardRef.current, { opacity: 0, scale: 0.9, x: 50 })
                tl.to(cardRef.current, {
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    duration: 0.8,
                    ease: 'back.out(1.2)'
                }, 0.4)
            }
        })

        return () => ctx.revert()
    }, [isCheckingAuth])

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                setError(error.message)
            } else {
                router.push('/')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'openid profile email https://www.googleapis.com/auth/calendar.events',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            })

            if (error) {
                setError(error.message)
                setIsLoading(false)
            }
        } catch (err) {
            setError('An unexpected error occurred')
            setIsLoading(false)
        }
    }

    // Full-screen loading state
    if (isCheckingAuth) {
        return (
            <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center animate-pulse">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                </div>
            </div>
        )
    }

    return (
        // STRICT FULL-SCREEN - No sidebar, no dashboard elements
        <div className="fixed inset-0 w-screen h-screen overflow-hidden flex">
            {/* Left Side - Branding (60%) */}
            <div
                ref={brandingRef}
                className="hidden lg:flex w-[60%] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden"
            >
                {/* Animated background orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center max-w-lg">
                    {/* Safety Mascot with floating animation */}
                    <div ref={mascotRef} className="mb-10">
                        <div className="w-44 h-44 mx-auto bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />
                            <Shield className="w-24 h-24 text-white drop-shadow-lg" />
                        </div>
                    </div>

                    {/* Headline with staggered fade-in */}
                    <h1
                        ref={headlineRef}
                        className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight"
                    >
                        HSE Command Center
                    </h1>

                    <p ref={subtitleRef} className="text-2xl text-blue-200 mb-3 font-light">
                        Version 2.0
                    </p>

                    <p ref={descRef} className="text-blue-300/70 max-w-md mx-auto text-lg leading-relaxed">
                        Enterprise Health, Safety & Environment Management Platform
                    </p>

                    {/* Feature badges */}
                    <div ref={featuresRef} className="mt-12 flex flex-wrap gap-4 justify-center">
                        {['Real-time Analytics', 'OTP Tracking', 'KPI Dashboard', 'Audit Logs'].map((feature) => (
                            <span
                                key={feature}
                                className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-blue-200 border border-white/20 font-medium"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer branding */}
                <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-blue-400/50 text-sm">Powered by Supabase & Next.js</p>
                </div>
            </div>

            {/* Right Side - Auth Form (40%) */}
            <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-[var(--bg-primary)] relative overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">HSE Command Center</h1>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Version 2.0</p>
                    </div>

                    {/* Login Card with GSAP pop-in */}
                    <div
                        ref={cardRef}
                        className="bg-[var(--bg-secondary)] rounded-2xl p-8 shadow-2xl border border-[var(--border-light)]"
                    >
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome Back</h2>
                        <p className="text-[var(--text-muted)] mb-6">Sign in to access your dashboard</p>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 animate-shake">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Google Login Button - Primary */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full py-4 px-4 bg-white border border-[var(--border-light)] rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="font-medium text-gray-700">Continue with Google</span>
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--border-light)]" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 bg-[var(--bg-secondary)] text-sm text-[var(--text-muted)]">
                                    or continue with email
                                </span>
                            </div>
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 border border-[var(--border-light)] rounded-xl bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-12 pr-12 py-3.5 border border-[var(--border-light)] rounded-xl bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Keep me logged in */}
                            <label className="flex items-center gap-3 cursor-pointer py-2 select-none">
                                <div
                                    onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${keepLoggedIn
                                        ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)]'
                                        : 'border-[var(--border-light)] hover:border-[var(--accent-blue)]'
                                        }`}
                                >
                                    {keepLoggedIn && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-[var(--text-secondary)]">Keep me logged in</span>
                            </label>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                            By signing in, you agree to our{' '}
                            <a href="#" className="text-[var(--accent-blue)] hover:underline">Terms of Service</a>
                        </p>
                    </div>

                    {/* Admin Notice */}
                    <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
                        🔒 Admin access restricted to authorized personnel only
                    </p>
                </div>
            </div>
        </div>
    )
}
