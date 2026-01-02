"use client"

import { useState, useRef } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Camera, Paperclip, Send, X, Loader2, Image as ImageIcon, Video, ChevronDown, AlertTriangle, CheckCircle, MessageSquare, Eye, AlertOctagon } from "lucide-react"
import { cn } from "@/lib/utils"

export type SafetyCategory = 'near_miss' | 'safe_act' | 'toolbox_talk' | 'observation' | 'incident'

interface PostComposerProps {
    userName?: string
    userAvatar?: string
    onPost?: (content: string, category: SafetyCategory, attachments?: File[]) => Promise<void>
    isPosting?: boolean
}

const SAFETY_CATEGORIES = [
    { value: 'observation', label: 'Observation', icon: Eye, color: 'text-purple-500' },
    { value: 'safe_act', label: 'Safe Act', icon: CheckCircle, color: 'text-green-500' },
    { value: 'near_miss', label: 'Near Miss', icon: AlertTriangle, color: 'text-orange-500' },
    { value: 'toolbox_talk', label: 'Toolbox Talk', icon: MessageSquare, color: 'text-blue-500' },
    { value: 'incident', label: 'Incident Report', icon: AlertOctagon, color: 'text-red-500' },
] as const

export function PostComposer({
    userName = "User",
    userAvatar,
    onPost,
    isPosting = false
}: PostComposerProps) {
    const [content, setContent] = useState("")
    const [category, setCategory] = useState<SafetyCategory>('observation')
    const [showCategoryMenu, setShowCategoryMenu] = useState(false)
    const [attachments, setAttachments] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    const selectedCategory = SAFETY_CATEGORIES.find(c => c.value === category)!

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
        if (e.target === fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        if (e.target === cameraInputRef.current) {
            cameraInputRef.current.value = ''
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if ((!content.trim() && attachments.length === 0) || !onPost) return

        await onPost(content, category, attachments.length > 0 ? attachments : undefined)
        setContent("")
        setAttachments([])
        setPreviews([])
    }

    const canSubmit = (content.trim() || attachments.length > 0) && !isPosting

    return (
        <GlassCard className="p-4">
            {/* Header with avatar and category */}
            <div className="flex items-start gap-3 mb-3">
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt={userName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-[var(--accent-blue)]/30"
                    />
                ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] flex items-center justify-center text-white font-bold">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>

                    {/* Category Selector */}
                    <div className="relative mt-1">
                        <button
                            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                                "bg-[var(--bg-tertiary)] border border-[var(--border-light)] hover:border-[var(--accent-blue)]"
                            )}
                        >
                            <selectedCategory.icon className={cn("w-3.5 h-3.5", selectedCategory.color)} />
                            <span className="text-[var(--text-secondary)]">{selectedCategory.label}</span>
                            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                        </button>

                        {/* Category dropdown */}
                        {showCategoryMenu && (
                            <div className="absolute left-0 top-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl shadow-xl z-10 py-1 min-w-[180px]">
                                {SAFETY_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.value}
                                        onClick={() => {
                                            setCategory(cat.value)
                                            setShowCategoryMenu(false)
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] transition-colors",
                                            category === cat.value && "bg-[var(--accent-blue)]/10"
                                        )}
                                    >
                                        <cat.icon className={cn("w-4 h-4", cat.color)} />
                                        <span className="text-[var(--text-primary)]">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Text input */}
            <textarea
                placeholder="Share an HSE observation, report a near miss, or celebrate a safe act..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPosting}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none min-h-[100px] mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent disabled:opacity-50"
            />

            {/* Attachment previews */}
            {previews.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative shrink-0">
                            {attachments[index]?.type.startsWith('video/') ? (
                                <div className="w-24 h-24 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-light)]">
                                    <Video className="w-8 h-8 text-[var(--text-muted)]" />
                                </div>
                            ) : (
                                <img
                                    src={preview}
                                    alt={`Attachment ${index + 1}`}
                                    className="w-24 h-24 rounded-xl object-cover border border-[var(--border-light)]"
                                />
                            )}
                            <button
                                onClick={() => removeAttachment(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--danger-color)] rounded-full flex items-center justify-center text-white shadow-lg"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--border-light)]">
                <div className="flex gap-1">
                    {/* Camera capture - mobile */}
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*,video/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isPosting}
                        className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--accent-blue)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                        title="Take Photo/Video"
                    >
                        <Camera className="w-5 h-5" />
                    </button>

                    {/* File picker */}
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
                        className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--accent-blue)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                        title="Add Photo/Video"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPosting}
                        className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--accent-blue)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                        title="Attach File"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
