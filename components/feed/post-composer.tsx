"use client"

import { useState, useRef } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Camera, Paperclip, Send, X, Loader2, Image as ImageIcon, Video } from "lucide-react"

interface PostComposerProps {
    userName?: string
    userAvatar?: string
    onPost?: (content: string, attachments?: File[]) => Promise<void>
    isPosting?: boolean
}

export function PostComposer({
    userName = "User",
    userAvatar,
    onPost,
    isPosting = false
}: PostComposerProps) {
    const [content, setContent] = useState("")
    const [attachments, setAttachments] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        // Add new files to attachments
        setAttachments(prev => [...prev, ...files])

        // Create previews for images/videos
        files.forEach(file => {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setPreviews(prev => [...prev, reader.result as string])
                }
                reader.readAsDataURL(file)
            }
        })

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if ((!content.trim() && attachments.length === 0) || !onPost) return

        await onPost(content, attachments.length > 0 ? attachments : undefined)
        setContent("")
        setAttachments([])
        setPreviews([])
    }

    const canSubmit = (content.trim() || attachments.length > 0) && !isPosting

    return (
        <GlassCard className="p-4">
            {/* Header with avatar */}
            <div className="flex items-start gap-3 mb-3">
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt={userName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[var(--accent-blue)]/30"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] flex items-center justify-center text-white font-bold">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Share an HSE update</p>
                </div>
            </div>

            {/* Text input */}
            <textarea
                placeholder="What's happening in HSE today? Share updates, observations, or safety tips..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPosting}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none min-h-[80px] mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent disabled:opacity-50"
            />

            {/* Attachment previews */}
            {previews.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative shrink-0">
                            {attachments[index]?.type.startsWith('video/') ? (
                                <div className="w-20 h-20 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                                    <Video className="w-8 h-8 text-[var(--text-muted)]" />
                                </div>
                            ) : (
                                <img
                                    src={preview}
                                    alt={`Attachment ${index + 1}`}
                                    className="w-20 h-20 rounded-lg object-cover"
                                />
                            )}
                            <button
                                onClick={() => removeAttachment(index)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--danger-color)] rounded-full flex items-center justify-center text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPosting}
                        className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--text-secondary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                    >
                        <ImageIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Photo</span>
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPosting}
                        className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--text-secondary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                    >
                        <Paperclip className="w-4 h-4" />
                        <span className="hidden sm:inline">File</span>
                    </button>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPosting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Posting...
                        </>
                    ) : (
                        <>
                            Post
                            <Send className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </GlassCard>
    )
}
