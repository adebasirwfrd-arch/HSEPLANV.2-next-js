"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, Lock, ArrowRight, Chrome, Building2, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { LottieDisplay } from '@/components/ui/lottie-display'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

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
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden"
            >
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.1, 0.15, 0.1]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center">
                    {/* Safety Mascot Animation */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-8"
                    >
                        <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <Shield className="w-20 h-20 text-white" />
                        </div>
                    </motion.div>

                    {/* Headline with staggered animation */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                    >
                        HSE Command Center
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-xl text-blue-200 mb-2"
                    >
                        Version 2.0
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        className="text-blue-300/70 max-w-sm mx-auto"
                    >
                        Health, Safety & Environment Management Platform for Enterprise Operations
                    </motion.p>

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.6 }}
                        className="mt-12 flex flex-wrap gap-4 justify-center"
                    >
                        {['Real-time Analytics', 'OTP Tracking', 'KPI Dashboard'].map((feature, i) => (
                            <motion.span
                                key={feature}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.2 + i * 0.1 }}
                                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-blue-200 border border-white/20"
                            >
                                {feature}
                            </motion.span>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Side - Auth Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--bg-primary)]"
            >
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] rounded-2xl flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">HSE Command Center</h1>
                    </div>

                    {/* Login Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="bg-[var(--bg-secondary)] rounded-2xl p-8 shadow-xl border border-[var(--border-light)]"
                    >
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome Back</h2>
                        <p className="text-[var(--text-muted)] mb-6">Sign in to access your dashboard</p>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{error}</span>
                            </motion.div>
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
                    </motion.div>

                    {/* Admin Notice */}
                    <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
                        🔒 Admin access restricted to authorized personnel only
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
