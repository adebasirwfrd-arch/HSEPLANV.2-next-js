"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FileText, Download, Loader2, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react"
import { GlassCard } from "./glass-card"
import { getExportSummary, generateExecutivePDF, generateRawDataCSV } from "@/lib/export-service"

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
    const [summary, setSummary] = useState<{
        totalPrograms: number
        completedPrograms: number
        completionRate: number
        totalTasks: number
    } | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [exportType, setExportType] = useState<'pdf' | 'csv' | null>(null)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

    // Load summary when modal opens
    useEffect(() => {
        if (isOpen) {
            try {
                const data = getExportSummary()
                setSummary(data)
            } catch (e) {
                console.error('Error loading export summary:', e)
            }
        }
    }, [isOpen])

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsGenerating(false)
            setExportType(null)
            setResult(null)
        }
    }, [isOpen])

    const handleExportPDF = async () => {
        setIsGenerating(true)
        setExportType('pdf')
        setResult(null)

        try {
            await generateExecutivePDF()
            setResult({ success: true, message: 'PDF report downloaded successfully!' })
        } catch (e) {
            console.error('PDF generation error:', e)
            setResult({ success: false, message: 'Failed to generate PDF. Please try again.' })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleExportCSV = async () => {
        setIsGenerating(true)
        setExportType('csv')
        setResult(null)

        try {
            generateRawDataCSV()
            setResult({ success: true, message: 'CSV data downloaded successfully!' })
        } catch (e) {
            console.error('CSV generation error:', e)
            setResult({ success: false, message: 'Failed to generate CSV. Please try again.' })
        } finally {
            setIsGenerating(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="fixed inset-0 z-[301] flex items-center justify-center p-4"
                    >
                        <div className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-md shadow-2xl border border-[var(--border-light)] overflow-hidden">
                            {/* Header */}
                            <div className="p-5 border-b border-[var(--border-light)] flex items-center justify-between bg-gradient-to-r from-[#667eea] to-[#764ba2]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Download className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Export Data</h2>
                                        <p className="text-xs text-white/80">Download HSE Reports</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                {/* Summary Card */}
                                {summary && (
                                    <div className="p-4 bg-gradient-to-br from-[var(--accent-blue)]/10 to-[var(--accent-purple)]/10 rounded-xl border border-[var(--border-light)]">
                                        <p className="text-sm text-[var(--text-secondary)] mb-2">Ready to export:</p>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-[var(--accent-blue)] rounded-full" />
                                                <span className="text-[var(--text-primary)] font-medium">{summary.totalPrograms} Programs</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-[var(--success-color)] rounded-full" />
                                                <span className="text-[var(--text-primary)] font-medium">{summary.completedPrograms} Completed</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-[var(--warning-color)] rounded-full" />
                                                <span className="text-[var(--text-primary)] font-medium">{summary.completionRate}% Rate</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-[var(--accent-purple)] rounded-full" />
                                                <span className="text-[var(--text-primary)] font-medium">{summary.totalTasks} Tasks</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Export Options */}
                                <div className="space-y-3">
                                    {/* PDF Option */}
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={isGenerating}
                                        className="w-full p-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-xl transition-all flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/30 transition-shadow">
                                            {isGenerating && exportType === 'pdf' ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : (
                                                <FileText className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold text-[var(--text-primary)]">Executive Report (PDF)</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Professional summary with KPI cards and tables</p>
                                        </div>
                                    </button>

                                    {/* CSV Option */}
                                    <button
                                        onClick={handleExportCSV}
                                        disabled={isGenerating}
                                        className="w-full p-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-xl transition-all flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/30 transition-shadow">
                                            {isGenerating && exportType === 'csv' ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : (
                                                <FileSpreadsheet className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold text-[var(--text-primary)]">Raw Data (CSV)</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Complete dataset for analysis and backup</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Result Message */}
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-3 rounded-lg flex items-center gap-2 ${result.success
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}
                                    >
                                        {result.success ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5" />
                                        )}
                                        <span className="text-sm font-medium">{result.message}</span>
                                    </motion.div>
                                )}

                                {/* Loading State */}
                                {isGenerating && (
                                    <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] py-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Generating {exportType === 'pdf' ? 'PDF' : 'CSV'}...</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-[var(--border-light)] bg-[var(--bg-secondary)]">
                                <p className="text-[10px] text-[var(--text-muted)] text-center">
                                    Reports include OTP, Matrix, and Task data. Last updated: {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
