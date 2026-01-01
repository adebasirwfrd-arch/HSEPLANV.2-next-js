'use client'

import { useState, useEffect } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { LLIndicatorReport } from '@/components/reports/LLIndicatorReport'
import { FileText } from 'lucide-react'

interface LLIndicator {
    id: number
    icon?: string
    name: string
    target: string
    actual: string
    intent?: string
}

interface LLYearData {
    year: number
    lagging: LLIndicator[]
    leading: LLIndicator[]
}

interface IndicatorPDFButtonProps {
    data: LLYearData
}

export default function IndicatorPDFButton({ data }: IndicatorPDFButtonProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const totalIndicators = data.lagging.length + data.leading.length

    if (!isClient || totalIndicators === 0) {
        return (
            <span className="px-3 py-2 bg-[var(--accent-purple)] text-white rounded-lg text-xs font-semibold opacity-50 flex items-center gap-1">
                <FileText className="w-3 h-3" /> PDF
            </span>
        )
    }

    return (
        <PDFDownloadLink
            document={<LLIndicatorReport data={data} />}
            fileName={`LL_Indicator_${data.year}.pdf`}
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
