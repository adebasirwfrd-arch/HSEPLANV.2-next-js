'use client'

import { motion } from 'framer-motion'
import { Construction, Clock, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
                <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl text-center"
            >
                {/* Icon */}
                <motion.div
                    animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1
                    }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
                >
                    <Construction className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-3">
                    Under Maintenance
                </h1>
                <p className="text-white/70 mb-6 leading-relaxed">
                    We're performing scheduled maintenance to improve your experience.
                    The system will be back online shortly.
                </p>

                {/* Status */}
                <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                    <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Estimated downtime: 30 minutes</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Link href="/">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Try Again
                        </motion.button>
                    </Link>

                    <a href="mailto:support@company.com">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            Contact Support
                        </motion.button>
                    </a>
                </div>

                {/* Footer */}
                <p className="mt-6 text-xs text-white/40">
                    HSE Management System v2.0
                </p>
            </motion.div>

            {/* Custom Animation Styles */}
            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    )
}
