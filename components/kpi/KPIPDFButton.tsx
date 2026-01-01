'use client'

import { useState, useEffect } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { KPIReport } from '@/components/reports/KPIReport'
import { FileText } from 'lucide-react'
import type { KPIYearData as StoreKPIYearData } from '@/lib/kpi-store'

interface KPIPDFButtonProps {
    data: StoreKPIYearData
}

export default function KPIPDFButton({ data }: KPIPDFButtonProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient || data.metrics.length === 0) {
        return (
            <span className="px-3 py-2 bg-[var(--accent-purple)] text-white rounded-lg text-xs font-semibold opacity-50 flex items-center gap-1">
                <FileText className="w-3 h-3" /> PDF
            </span>
        )
    }

    // Transform data to match PDF report format (convert numbers to strings)
    const pdfData = {
        year: data.year,
        manHours: data.manHours,
        metrics: data.metrics.map(m => ({
            id: m.id,
            icon: m.icon,
            name: m.name,
            target: String(m.target),
            result: String(m.result)
        }))
    }

    return (
        <PDFDownloadLink
            document={<KPIReport data={pdfData} />}
            fileName={`HSE_KPI_${data.year}.pdf`}
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
