"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { PageTransition, PageHeader } from "@/components/ui/page-transition"
import {
    MessageSquare,
    TrendingUp,
    Shield,
    Users,
    FileText,
    AlertTriangle,
    Heart,
    Send,
    Clock,
    ThumbsUp,
    MessageCircle,
    Share2,
    Bookmark,
    Image as ImageIcon,
    Video,
    X,
    Loader2,
    Lock,
    Trash2,
    MoreHorizontal
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useAdmin } from "@/hooks/useAdmin"

// =====================================================
// Types
// =====================================================

interface SafetyMoment {
    id: string
    author_id: string
    author_name: string
    author_avatar: string | null
    author_role: string
    title: string
    content: string
    category: string
    media: { type: 'image' | 'video'; url: string }[]
    thumbnail_url: string | null
    likes_count: number
    comments_count: number
    shares_count: number
    saves_count: number
    is_featured: boolean
    created_at: string
}

interface MomentComment {
    id: string
    author_name: string
    author_avatar: string | null
    content: string
    created_at: string
}

interface UserInteraction {
    liked: boolean
    saved: boolean
}

// =====================================================
// Constants
// =====================================================

const CATEGORIES = [
    'General',
    'Personal Safety',
    'Emergency Response',
    'Communication',
    'Workplace Safety',
    'Near Miss',
    'Good Practice',
    'Training'
]

const TRENDING_TOPICS = [
    { id: 1, title: "PPE Compliance", count: 24, icon: Shield },
    { id: 2, title: "Incident Reports", count: 12, icon: AlertTriangle },
    { id: 3, title: "Safety Training", count: 18, icon: Users },
    { id: 4, title: "Toolbox Meetings", count: 31, icon: MessageSquare },
]

// =====================================================
// Safety Moment Card Component
// =====================================================

function SafetyMomentCard({
    moment,
    isAdmin,
    onDelete,
    onLike,
    onSave,
    userInteraction
}: {
    moment: SafetyMoment
    isAdmin: boolean
    onDelete: (id: string) => void
    onLike: (id: string) => void
    onSave: (id: string) => void
    userInteraction: UserInteraction
}) {
    const [showComments, setShowComments] = useState(false)
    const [comments, setComments] = useState<MomentComment[]>([])
    const [newComment, setNewComment] = useState("")
    const [isLoadingComments, setIsLoadingComments] = useState(false)

    const loadComments = async () => {
        if (!showComments) {
            setIsLoadingComments(true)
            const supabase = createClient()
            const { data } = await supabase
                .from('safety_moment_comments')
                .select('*')
                .eq('moment_id', moment.id)
                .order('created_at', { ascending: true })
                .limit(10)

            setComments(data || [])
            setIsLoadingComments(false)
        }
        setShowComments(!showComments)
    }

    const handleAddComment = async () => {
        if (!newComment.trim()) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('safety_moment_comments' as any)
            .insert({
                moment_id: moment.id,
                author_id: user.id,
                author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                author_avatar: user.user_metadata?.avatar_url,
                content: newComment
            } as any)
            .select()
            .single()

        if (!error && data) {
            setComments([...comments, data])
            setNewComment("")
        }
    }

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[var(--bg-tertiary)] rounded-xl"
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] rounded-full flex items-center justify-center overflow-hidden">
                    {moment.author_avatar ? (
                        <img src={moment.author_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white font-bold">
                            {moment.author_name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-semibold text-[var(--text-primary)]">{moment.author_name}</span>
                            <span className="text-xs text-[var(--text-muted)] ml-2">{moment.author_role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {timeAgo(moment.created_at)}
                            </span>
                            {isAdmin && (
                                <button
                                    onClick={() => onDelete(moment.id)}
                                    className="p-1 text-red-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Badge */}
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-full">
                        {moment.category}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="mt-3">
                <h4 className="font-semibold text-[var(--text-primary)]">{moment.title}</h4>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{moment.content}</p>
            </div>

            {/* Media */}
            {moment.media && moment.media.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                    {moment.media.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-black">
                            {item.type === 'image' ? (
                                <img src={item.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <video src={item.url} controls className="w-full h-full object-cover" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border-light)]">
                <button
                    onClick={() => onLike(moment.id)}
                    className={`flex items-center gap-1 text-xs transition-colors ${userInteraction.liked
                        ? 'text-[var(--accent-blue)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--accent-blue)]'
                        }`}
                >
                    <ThumbsUp className={`w-4 h-4 ${userInteraction.liked ? 'fill-current' : ''}`} />
                    {moment.likes_count}
                </button>
                <button
                    onClick={loadComments}
                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
                >
                    <MessageCircle className="w-4 h-4" />
                    {moment.comments_count}
                </button>
                <button className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors">
                    <Share2 className="w-4 h-4" />
                    {moment.shares_count}
                </button>
                <button
                    onClick={() => onSave(moment.id)}
                    className={`flex items-center gap-1 text-xs ml-auto transition-colors ${userInteraction.saved
                        ? 'text-[var(--accent-purple)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--accent-purple)]'
                        }`}
                >
                    <Bookmark className={`w-4 h-4 ${userInteraction.saved ? 'fill-current' : ''}`} />
                    Save
                </button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t border-[var(--border-light)]"
                    >
                        {isLoadingComments ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="flex gap-2 p-2 bg-[var(--bg-secondary)] rounded-lg">
                                            <div className="w-6 h-6 bg-[var(--accent-blue)] rounded-full flex items-center justify-center text-xs text-white">
                                                {comment.author_name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs font-medium text-[var(--text-primary)]">
                                                    {comment.author_name}
                                                </span>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && (
                                        <p className="text-xs text-[var(--text-muted)] text-center py-2">
                                            No comments yet. Be the first!
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        className="px-3 py-1.5 bg-[var(--accent-blue)] text-white rounded-lg text-xs"
                                    >
                                        Post
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// =====================================================
// Create Moment Form Component
// =====================================================

function CreateMomentForm({ onSuccess }: { onSuccess: () => void }) {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [category, setCategory] = useState("General")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadedMedia, setUploadedMedia] = useState<{ type: 'image' | 'video'; url: string }[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle file upload manually (we'll upload to UploadThing)
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setIsUploading(true)

        try {
            // Upload each file
            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)

                // Determine file type
                const mediaType = file.type.startsWith('video/') ? 'video' : 'image'

                // Upload via our API
                const response = await fetch('/api/uploadthing', {
                    method: 'POST',
                    body: formData,
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.url) {
                        setUploadedMedia(prev => [...prev, { type: mediaType, url: data.url }])
                    }
                } else {
                    // Fallback: Use data URL for preview (won't persist but allows demo)
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        setUploadedMedia(prev => [...prev, {
                            type: mediaType,
                            url: reader.result as string
                        }])
                    }
                    reader.readAsDataURL(file)
                }
            }
        } catch (error) {
            console.error('Upload error:', error)
            // Fallback to local preview
            for (const file of files) {
                const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
                const reader = new FileReader()
                reader.onloadend = () => {
                    setUploadedMedia(prev => [...prev, {
                        type: mediaType,
                        url: reader.result as string
                    }])
                }
                reader.readAsDataURL(file)
            }
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeMedia = (index: number) => {
        setUploadedMedia(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return

        setIsSubmitting(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setIsSubmitting(false)
            return
        }

        // Prepare media data
        const thumbnailUrl = uploadedMedia.length > 0
            ? (uploadedMedia.find(m => m.type === 'image')?.url || uploadedMedia[0]?.url)
            : null

        const { error } = await supabase
            .from('safety_moments' as any)
            .insert({
                author_id: user.id,
                author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
                author_avatar: user.user_metadata?.avatar_url,
                author_role: 'HSE Admin',
                title,
                content,
                category,
                media: uploadedMedia.length > 0 ? uploadedMedia : [],
                thumbnail_url: thumbnailUrl
            } as any)

        if (!error) {
            setTitle("")
            setContent("")
            setCategory("General")
            setUploadedMedia([])
            onSuccess()
        }
        setIsSubmitting(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full p-3 bg-[var(--bg-tertiary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50"
                />
            </div>
            <div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-[var(--bg-tertiary)] rounded-xl text-sm text-[var(--text-primary)] border border-[var(--border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50"
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            <div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share a safety moment, tip, or observation..."
                    className="w-full p-3 bg-[var(--bg-tertiary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 resize-none"
                    rows={4}
                />
            </div>

            {/* Media Upload Section */}
            <div className="space-y-2">
                {/* Media Previews */}
                {uploadedMedia.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {uploadedMedia.map((media, idx) => (
                            <div key={idx} className="relative group w-20 h-20">
                                {media.type === 'image' ? (
                                    <img src={media.url} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="w-full h-full bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
                                        <Video className="w-6 h-6 text-[var(--text-muted)]" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeMedia(idx)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Button */}
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
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <ImageIcon className="w-4 h-4" />
                        )}
                        {isUploading ? 'Uploading...' : 'Add Photo/Video'}
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={!title.trim() || !content.trim() || isSubmitting || isUploading}
                    className="px-4 py-2 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    Post Safety Moment
                </button>
            </div>
        </form>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function CommunityPage() {
    const router = useRouter()
    const { user, isAdmin, isLoading: isAuthLoading } = useAdmin()
    const [moments, setMoments] = useState<SafetyMoment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userInteractions, setUserInteractions] = useState<Record<string, UserInteraction>>({})

    // Redirect non-admin users
    useEffect(() => {
        if (!isAuthLoading && !isAdmin) {
            router.push('/')
        }
    }, [isAdmin, isAuthLoading, router])

    // Load moments
    const loadMoments = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('safety_moments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        setMoments(data || [])
        setIsLoading(false)
    }

    // Load user interactions
    const loadInteractions = async () => {
        if (!user) return

        const supabase = createClient()
        const { data } = await supabase
            .from('safety_moment_interactions' as any)
            .select('moment_id, interaction_type')
            .eq('user_id', user.id)

        const interactions: Record<string, UserInteraction> = {}
            ; (data as any[])?.forEach((item: any) => {
                if (!interactions[item.moment_id]) {
                    interactions[item.moment_id] = { liked: false, saved: false }
                }
                if (item.interaction_type === 'like') interactions[item.moment_id].liked = true
                if (item.interaction_type === 'save') interactions[item.moment_id].saved = true
            })
        setUserInteractions(interactions)
    }

    useEffect(() => {
        if (isAdmin) {
            loadMoments()
            loadInteractions()
        }
    }, [isAdmin, user])

    // Handle like
    const handleLike = async (momentId: string) => {
        if (!user) return
        const supabase = createClient()
        const current = userInteractions[momentId]?.liked || false

        if (current) {
            await supabase
                .from('safety_moment_interactions' as any)
                .delete()
                .match({ moment_id: momentId, user_id: user.id, interaction_type: 'like' })
        } else {
            await supabase
                .from('safety_moment_interactions' as any)
                .insert({ moment_id: momentId, user_id: user.id, interaction_type: 'like' } as any)
        }

        setUserInteractions(prev => ({
            ...prev,
            [momentId]: { ...prev[momentId], liked: !current }
        }))
        loadMoments()
    }

    // Handle save
    const handleSave = async (momentId: string) => {
        if (!user) return
        const supabase = createClient()
        const current = userInteractions[momentId]?.saved || false

        if (current) {
            await supabase
                .from('safety_moment_interactions' as any)
                .delete()
                .match({ moment_id: momentId, user_id: user.id, interaction_type: 'save' })
        } else {
            await supabase
                .from('safety_moment_interactions' as any)
                .insert({ moment_id: momentId, user_id: user.id, interaction_type: 'save' } as any)
        }

        setUserInteractions(prev => ({
            ...prev,
            [momentId]: { ...prev[momentId], saved: !current }
        }))
    }

    // Handle delete
    const handleDelete = async (momentId: string) => {
        if (!confirm('Are you sure you want to delete this moment?')) return

        const supabase = createClient()
        await supabase.from('safety_moments').delete().eq('id', momentId)
        loadMoments()
    }

    // Show loading or access denied
    if (isAuthLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
                </div>
            </AppShell>
        )
    }

    if (!isAdmin) {
        return (
            <AppShell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <Lock className="w-16 h-16 text-[var(--text-muted)] mb-4" />
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Admin Access Only</h2>
                    <p className="text-[var(--text-muted)] mt-2">
                        This page is restricted to administrators.
                    </p>
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell>
            <PageTransition className="space-y-4">
                {/* Header */}
                <PageHeader className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center text-2xl">
                        💬
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">Safety Moments</h1>
                        <p className="text-xs text-[var(--text-muted)]">Admin Portal - Manage safety content</p>
                    </div>
                    <div className="px-3 py-1 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-full text-xs font-semibold flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                    </div>
                </PageHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Feed Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Create Moment Form */}
                        <GlassCard className="p-4">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[var(--accent-blue)]" />
                                Create Safety Moment
                            </h3>
                            <CreateMomentForm onSuccess={loadMoments} />
                        </GlassCard>

                        {/* Safety Moments Feed */}
                        <GlassCard className="p-4">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[var(--success-color)]" />
                                Safety Moments Feed
                                <span className="text-xs text-[var(--text-muted)]">({moments.length})</span>
                            </h3>

                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-blue)]" />
                                </div>
                            ) : moments.length === 0 ? (
                                <div className="text-center py-8 text-[var(--text-muted)]">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No safety moments yet. Create the first one!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {moments.map((moment) => (
                                            <SafetyMomentCard
                                                key={moment.id}
                                                moment={moment}
                                                isAdmin={isAdmin}
                                                onDelete={handleDelete}
                                                onLike={handleLike}
                                                onSave={handleSave}
                                                userInteraction={userInteractions[moment.id] || { liked: false, saved: false }}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </GlassCard>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-4">
                        {/* Trending Topics */}
                        <GlassCard className="p-4">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[var(--accent-blue)]" />
                                Trending Topics
                            </h3>
                            <div className="space-y-2">
                                {TRENDING_TOPICS.map((topic) => (
                                    <div
                                        key={topic.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                                    >
                                        <div className="w-8 h-8 bg-[var(--accent-blue)]/10 rounded-lg flex items-center justify-center">
                                            <topic.icon className="w-4 h-4 text-[var(--accent-blue)]" />
                                        </div>
                                        <span className="flex-1 text-sm text-[var(--text-primary)]">{topic.title}</span>
                                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
                                            {topic.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Quick Stats */}
                        <GlassCard className="p-4">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4 text-[var(--accent-purple)]" />
                                Content Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                                    <div className="text-2xl font-bold text-[var(--accent-blue)]">{moments.length}</div>
                                    <div className="text-xs text-[var(--text-muted)]">Total Posts</div>
                                </div>
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                                    <div className="text-2xl font-bold text-[var(--success-color)]">
                                        {moments.reduce((sum, m) => sum + m.likes_count, 0)}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)]">Total Likes</div>
                                </div>
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                                    <div className="text-2xl font-bold text-[var(--accent-purple)]">
                                        {moments.reduce((sum, m) => sum + m.comments_count, 0)}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)]">Comments</div>
                                </div>
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                                    <div className="text-2xl font-bold text-[var(--warning-color)]">
                                        {moments.filter(m => m.is_featured).length}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)]">Featured</div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </PageTransition>
        </AppShell>
    )
}
