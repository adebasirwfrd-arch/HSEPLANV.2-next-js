"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { FileText, ExternalLink, Download, Search, Plus, X, Upload, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    loadDocuments,
    addDocument,
    deleteDocument,
    searchDocuments,
    documentTypes,
    getTypeLabel,
    formatFileSize,
    type RelatedDocument
} from "@/lib/docs-store"

export default function RelatedDocsPage() {
    const [documents, setDocuments] = useState<RelatedDocument[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [createModal, setCreateModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)

    useEffect(() => {
        setDocuments(loadDocuments())
    }, [])

    // Filter documents by search
    const filteredDocuments = searchQuery
        ? searchDocuments(searchQuery)
        : documents

    const handleCreate = (data: Omit<RelatedDocument, 'id' | 'createdAt'>) => {
        addDocument(data)
        setDocuments(loadDocuments())
        setCreateModal(false)
    }

    const handleDelete = (id: string) => {
        deleteDocument(id)
        setDocuments(loadDocuments())
        setDeleteModal(null)
    }

    // Document Form Component
    const DocumentForm = ({ onSave, onCancel }: {
        onSave: (data: Omit<RelatedDocument, 'id' | 'createdAt'>) => void
        onCancel: () => void
    }) => {
        const [docName, setDocName] = useState("")
        const [docType, setDocType] = useState("policy")
        const [wptsId, setWptsId] = useState("")
        const [attachment, setAttachment] = useState<RelatedDocument['attachment'] | undefined>()
        const [uploading, setUploading] = useState(false)
        const [fileSize, setFileSize] = useState("")
        const fileInputRef = useRef<HTMLInputElement>(null)

        const handleFileUpload = async (files: FileList | null) => {
            if (!files || files.length === 0 || !docName.trim()) return

            setUploading(true)
            const file = files[0]
            setFileSize(formatFileSize(file.size))

            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('programName', `Related Documents/${docName}`)

                const res = await fetch('/api/drive', {
                    method: 'POST',
                    body: formData
                })

                if (res.ok) {
                    const data = await res.json()
                    setAttachment({
                        ...data.file,
                        downloadUrl: data.file.downloadUrl || data.file.driveUrl
                    })
                } else {
                    const errorText = await res.text()
                    console.error('Upload failed:', errorText)
                    alert(`Upload failed: ${errorText}`)
                }
            } catch (error) {
                console.error('Upload error:', error)
                alert(`Upload error: ${error}`)
            }

            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }

        return (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)]">
                        <h3 className="font-bold text-lg">Create New Document</h3>
                        <button onClick={onCancel} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            onSave({
                                name: docName,
                                type: docType,
                                wptsId,
                                size: fileSize || '-',
                                attachment,
                            })
                        }}
                        className="p-4 space-y-4"
                    >
                        <div>
                            <label className="block text-xs font-medium mb-1">Document Name *</label>
                            <input
                                type="text"
                                required
                                value={docName}
                                onChange={(e) => setDocName(e.target.value)}
                                className="w-full p-2.5 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                                placeholder="e.g. HSE Policy Manual"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Document Type *</label>
                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                className="w-full p-2.5 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                            >
                                {documentTypes.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">WPTS ID</label>
                            <input
                                type="text"
                                value={wptsId}
                                onChange={(e) => setWptsId(e.target.value)}
                                className="w-full p-2.5 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                                placeholder="e.g. WPTS-DOC-001"
                            />
                        </div>

                        {/* Attachment Upload */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Attachment</label>
                            <div
                                onClick={() => docName.trim() && fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
                                    docName.trim()
                                        ? "border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5"
                                        : "border-[var(--border-light)] opacity-50 cursor-not-allowed"
                                )}
                            >
                                {uploading ? (
                                    <div className="text-[var(--accent-blue)]">
                                        <div className="animate-spin w-6 h-6 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full mx-auto mb-2"></div>
                                        <p className="font-medium">Uploading...</p>
                                        <p className="text-xs">Please wait</p>
                                    </div>
                                ) : attachment ? (
                                    <div className="text-[var(--success-color)]">
                                        <FileText className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-medium">{attachment.filename}</p>
                                        <p className="text-xs text-[var(--text-muted)]">Uploaded to Google Drive</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)]" />
                                        <p className="text-sm text-[var(--text-secondary)]">Click to upload file</p>
                                        <p className="text-xs text-[var(--text-muted)]">Files stored in Google Drive</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                disabled={!docName.trim() || uploading}
                            />
                            {!docName.trim() && (
                                <p className="text-xs text-[var(--warning-color)] mt-1">Enter document name first to enable upload</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onCancel} className="flex-1 p-2.5 border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)] font-medium">Cancel</button>
                            <button type="submit" className="flex-1 p-2.5 bg-[var(--accent-blue)] text-white rounded-lg font-semibold">Save Document</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <AppShell>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-xl flex items-center justify-center text-2xl">
                            📁
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">Related Docs</h1>
                            <p className="text-xs text-[var(--text-muted)]">HSE Documents & Resources</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCreateModal(true)}
                        className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[var(--accent-blue)]/20"
                    >
                        <Plus className="w-4 h-4" /> Create
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                    />
                </div>

                {/* Documents List */}
                <div className="space-y-3">
                    {filteredDocuments.length === 0 ? (
                        <GlassCard className="p-8 text-center">
                            <p className="text-[var(--text-muted)]">
                                {searchQuery ? "No documents match your search." : "No documents found. Click \"Create\" to add one."}
                            </p>
                        </GlassCard>
                    ) : (
                        filteredDocuments.map((doc, idx) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ x: 5, scale: 1.01 }}
                            >
                                <GlassCard className="p-4 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-[var(--accent-blue)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[var(--text-primary)] truncate">{doc.name}</h3>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {getTypeLabel(doc.type)} • {doc.size} • {doc.createdAt}
                                                {doc.wptsId && <span className="ml-2 text-[var(--success-color)]">WPTS: {doc.wptsId}</span>}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            {doc.attachment?.driveUrl && (
                                                <a
                                                    href={doc.attachment.driveUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                                                </a>
                                            )}
                                            {doc.attachment?.downloadUrl && (
                                                <a
                                                    href={doc.attachment.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                >
                                                    <Download className="w-4 h-4 text-[var(--accent-blue)]" />
                                                </a>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ id: doc.id, name: doc.name }) }}
                                                className="p-2 hover:bg-[var(--danger-color)]/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--danger-color)]" />
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                {createModal && (
                    <DocumentForm onSave={handleCreate} onCancel={() => setCreateModal(false)} />
                )}

                {/* Delete Modal */}
                {deleteModal && (
                    <div className="fixed inset-0 bg-black/50 z-[400] flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-sm">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--danger-color)]/10 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8 text-[var(--danger-color)]" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Delete Document?</h3>
                                <p className="text-sm text-[var(--text-muted)] mb-4">Are you sure you want to delete <strong>&quot;{deleteModal.name}&quot;</strong>?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteModal(null)} className="flex-1 p-3 border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)] font-medium">Cancel</button>
                                    <button onClick={() => handleDelete(deleteModal.id)} className="flex-1 p-3 bg-[var(--danger-color)] text-white rounded-lg font-semibold">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    )
}
