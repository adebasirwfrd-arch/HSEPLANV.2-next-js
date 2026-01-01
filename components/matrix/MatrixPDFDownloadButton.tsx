'use client'

import { useState, useEffect } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { MatrixReport } from '@/components/reports/MatrixReport'
import { FileText } from 'lucide-react'
import type { MatrixProgram } from '@/lib/matrix-store'

interface MatrixPDFDownloadButtonProps {
    programs: MatrixProgram[]
    category: string
    base: string
    year: number
}

export default function MatrixPDFDownloadButton({ programs, category, base, year }: MatrixPDFDownloadButtonProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient || programs.length === 0) {
        return (
            <span className="px-3 py-2 bg-[var(--accent-purple)] text-white rounded-lg text-xs font-semibold opacity-50 flex items-center gap-1">
                <FileText className="w-3 h-3" /> PDF
            </span>
        )
    }

    return (
        <PDFDownloadLink
            document={
                <MatrixReport
                    programs={programs}
                    category={category}
                    base={base}
                    year={year}
                />
            }
            fileName={`Matrix_${category}_${base}_${year}.pdf`}
            className="px-3 py-2 bg-[var(--accent-purple)] text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition-opacity"
        >
            {({ loading }) => (
                loading ? (
                    <>
                        <FileText className="w-3 h-3 animate-pulse" /> Generating...
                    </>
                ) : (
                    <>
                        <FileText className="w-3 h-3" /> PDF
                    </>
                )
            )}
        </PDFDownloadLink>
    )
}
