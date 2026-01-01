import { FileText } from "lucide-react"

export function PDFButtonFallback() {
    return (
        <span className="px-3 py-2 bg-blue-500/50 text-white rounded-lg text-xs font-semibold opacity-50 flex items-center gap-1 cursor-wait">
            <FileText className="w-3 h-3 animate-pulse" /> Generating...
        </span>
    )
}
