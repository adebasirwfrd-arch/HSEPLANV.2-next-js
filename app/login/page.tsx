"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, Lock, ArrowRight, Chrome, Building2, Loader2, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
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

    // GSAP Animations
    useEffect(() => {
        if (isCheckingAuth) return

        // Timeline for staggered animations
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        // Branding side entrance
        if (brandingRef.current) {
            gsap.set(brandingRef.current, { opacity: 0, x: -50 })
            tl.to(brandingRef.current, { opacity: 1, x: 0, duration: 0.8 }, 0)
        }

        // Mascot floating animation
        if (mascotRef.current) {
            gsap.set(mascotRef.current, { opacity: 0, scale: 0.8, y: 20 })
            tl.to(mascotRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.6 }, 0.3)

            // Continuous floating effect
            gsap.to(mascotRef.current, {
                y: -15,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            })
        }

        // Staggered headline animation
        if (headlineRef.current) {
            gsap.set(headlineRef.current, { opacity: 0, y: 30 })
            tl.to(headlineRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.4)
        }

        if (subtitleRef.current) {
            gsap.set(subtitleRef.current, { opacity: 0, y: 30 })
            tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.5)
        }

        if (descRef.current) {
            gsap.set(descRef.current, { opacity: 0, y: 30 })
            tl.to(descRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.6)
        }

        // Card pop-in with bounce
        if (cardRef.current) {
            gsap.set(cardRef.current, { opacity: 0, scale: 0.9, y: 30 })
            tl.to(cardRef.current, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.7,
                ease: 'back.out(1.2)'
            }, 0.3)
        }
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

    const handleOAuthLogin = async (provider: 'google' | 'azure') => {
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
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

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div
                ref={brandingRef}
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden"
            >
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center">
                    {/* Safety Mascot Animation */}
                    <div ref={mascotRef} className="mb-8">
                        <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <Shield className="w-20 h-20 text-white" />
                        </div>
                    </div>

                    {/* Headline with staggered animation */}
                    <h1
                        ref={headlineRef}
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                    >
                        HSE Command Center
                    </h1>

                    <p ref={subtitleRef} className="text-xl text-blue-200 mb-2">
                        Version 2.0
                    </p>

                    <p ref={descRef} className="text-blue-300/70 max-w-sm mx-auto">
                        Health, Safety & Environment Management Platform for Enterprise Operations
                    </p>

                    {/* Features */}
                    <div className="mt-12 flex flex-wrap gap-4 justify-center">
                        {['Real-time Analytics', 'OTP Tracking', 'KPI Dashboard'].map((feature, i) => (
                            <span
                                key={feature}
                                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-blue-200 border border-white/20"
                                style={{ animationDelay: `${1.2 + i * 0.1}s` }}
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--bg-primary)]">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] rounded-2xl flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">HSE Command Center</h1>
                    </div>

                    {/* Login Card */}
                    <div
                        ref={cardRef}
                        className="bg-[var(--bg-secondary)] rounded-2xl p-8 shadow-xl border border-[var(--border-light)]"
                    >
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome Back</h2>
                        <p className="text-[var(--text-muted)] mb-6">Sign in to access your dashboard</p>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* OAuth Buttons */}
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => handleOAuthLogin('google')}
                                disabled={isLoading}
                                className="w-full py-3 px-4 border border-[var(--border-light)] rounded-xl flex items-center justify-center gap-3 hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                            >
                                <Chrome className="w-5 h-5 text-[#4285f4]" />
                                <span className="font-medium text-[var(--text-primary)]">Sign in with Google</span>
                            </button>

                            <button
                                onClick={() => handleOAuthLogin('azure')}
                                disabled={isLoading}
                                className="w-full py-3 px-4 border border-[var(--border-light)] rounded-xl flex items-center justify-center gap-3 hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                            >
                                <Building2 className="w-5 h-5 text-[#00a4ef]" />
                                <span className="font-medium text-[var(--text-primary)]">Sign in with Microsoft</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--border-light)]" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-3 bg-[var(--bg-secondary)] text-sm text-[var(--text-muted)]">
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
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        required
                                        className="w-full pl-11 pr-4 py-3 border border-[var(--border-light)] rounded-xl bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-11 pr-12 py-3 border border-[var(--border-light)] rounded-xl bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Keep me logged in */}
                            <label className="flex items-center gap-3 cursor-pointer py-2">
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
                                className="w-full py-3 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
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

                        {/* Footer Links */}
                        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
                            <p>
                                By signing in, you agree to our{' '}
                                <a href="#" className="text-[var(--accent-blue)] hover:underline">Terms of Service</a>
                            </p>
                        </div>
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
