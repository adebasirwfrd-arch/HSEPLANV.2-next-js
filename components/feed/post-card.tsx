"use client"

import { useState, useRef, useCallback } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Heart, MessageCircle, Share2, Bookmark, Play, Pause, Volume2, VolumeX, Send, Trash2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface CommentData {
    id: string
    author: string
    authorAvatar?: string
    content: string
    time: string
    likes: number
}

export interface PostData {
    id: string
    author: string
    authorAvatar?: string
    authorRole: string
    time: string
    content: string
    category?: 'near_miss' | 'safe_act' | 'toolbox_talk' | 'observation' | 'incident'
    media?: {
        type: 'image' | 'video'
        url: string
        thumbnail?: string
    }[]
    image?: string // Legacy support
    likes: number
    comments: CommentData[]
    shares: number
    isLiked?: boolean
    isSaved?: boolean
}

interface PostCardProps {
    post: PostData
    onLike?: (postId: string) => void
    onComment?: (postId: string, content: string) => void
    onDelete?: (postId: string) => Promise<void>
    canDelete?: boolean
}

// Category badge component
function CategoryBadge({ category }: { category: PostData['category'] }) {
    if (!category) return null

    const categoryConfig = {
        near_miss: { label: 'Near Miss', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
        safe_act: { label: 'Safe Act', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
        toolbox_talk: { label: 'Toolbox Talk', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        observation: { label: 'Observation', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
        incident: { label: 'Incident', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
    }

    const config = categoryConfig[category]
    return (
        <span className={cn("px-2 py-0.5 text-[10px] font-medium rounded-full border", config.color)}>
            {config.label}
        </span>
    )
}

// Video player component
function VideoPlayer({ src, thumbnail }: { src: string; thumbnail?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    return (
        <div className="relative w-full aspect-video bg-black">
            <video
                ref={videoRef}
                src={src}
                poster={thumbnail}
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain"
                onClick={togglePlay}
            />

            {/* Play/Pause overlay */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted) }}
                    className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                    {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                    )}
                </button>
            </div>
        </div>
    )
}

// Heart animation component
function HeartAnimation() {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-lg" />
        </motion.div>
    )
}

export function PostCard({ post, onLike, onComment, onDelete, canDelete }: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.isLiked)
    const [likes, setLikes] = useState(post.likes || 0)
    const [showComments, setShowComments] = useState(false)
    const [isSaved, setIsSaved] = useState(post.isSaved)
    const [showHeartAnimation, setShowHeartAnimation] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [newComment, setNewComment] = useState("")
    const lastTapRef = useRef<number>(0)

    const handleLike = useCallback(() => {
        if (!isLiked) {
            setIsLiked(true)
            setLikes(prev => prev + 1)
            onLike?.(post.id)
        } else {
            setIsLiked(false)
            setLikes(prev => prev - 1)
        }
    }, [isLiked, onLike, post.id])

    // Double tap to like
    const handleDoubleTap = useCallback(() => {
        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // Double tap detected
            if (!isLiked) {
                setIsLiked(true)
                setLikes(prev => prev + 1)
                onLike?.(post.id)
            }
            setShowHeartAnimation(true)
            setTimeout(() => setShowHeartAnimation(false), 600)
        }

        lastTapRef.current = now
    }, [isLiked, onLike, post.id])

    const handleCommentSubmit = () => {
        if (newComment.trim()) {
            onComment?.(post.id, newComment)
            setNewComment("")
        }
    }

    const initials = post.author.split(' ').map(n => n[0]).join('').slice(0, 2)

    // Get media from new format or legacy
    const media = post.media || (post.image ? [{ type: 'image' as const, url: post.image }] : [])

    const handleDelete = async () => {
        if (!onDelete) return
        setIsDeleting(true)
        try {
            await onDelete(post.id)
        } catch {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Post by ${post.author}`,
                    text: post.content,
                    url: window.location.href
                })
            } else {
                await navigator.clipboard.writeText(window.location.href)
                // Optional: You could add a toast here, but for now we'll just rely on the action
                alert('Link copied to clipboard!')
            }
        } catch (error) {
            console.error('Error sharing:', error)
        }
    }

    return (
        <GlassCard className="overflow-hidden relative">
            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Post?</h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Post Header */}
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    {post.authorAvatar ? (
                        <img
                            src={post.authorAvatar}
                            alt={post.author}
                            className="w-11 h-11 rounded-full object-cover border-2 border-[var(--accent-blue)]/30"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] flex items-center justify-center text-white font-bold text-sm">
                            {initials}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-[var(--text-primary)] truncate">{post.author}</p>
                            <CategoryBadge category={post.category} />
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">{post.authorRole} • {post.time}</p>
                    </div>

                    {/* Delete Option */}
                    {canDelete && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Post"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Post Content */}
                <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
                    {post.content}
                </p>
            </div>

            {/* Media Gallery with double-tap to like */}
            {media.length > 0 && (
                <div
                    className="relative cursor-pointer select-none"
                    onClick={handleDoubleTap}
                >
                    {media.length === 1 ? (
                        // Single media
                        media[0].type === 'video' ? (
                            <VideoPlayer src={media[0].url} thumbnail={media[0].thumbnail} />
                        ) : (
                            <div className="relative w-full bg-[var(--bg-tertiary)]">
                                <Image
                                    src={media[0].url}
                                    alt="Post image"
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    className="w-full h-auto max-h-[600px] object-contain bg-black/5"
                                    unoptimized
                                />
                            </div>
                        )
                    ) : (
                        // Multiple images - Horizontal Carousel
                        <div className="relative group">
                            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                                {media.map((item, idx) => (
                                    <div key={idx} className="relative w-full flex-shrink-0 snap-center bg-[var(--bg-tertiary)]">
                                        <div className="relative w-full aspect-[4/3]">
                                            {item.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-black">
                                                    <VideoPlayer src={item.url} thumbnail={item.thumbnail} />
                                                </div>
                                            ) : (
                                                <Image
                                                    src={item.url}
                                                    alt={`Post image ${idx + 1}`}
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Carousel Indicator Dots */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full pointer-events-none z-10">
                                {media.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="w-1.5 h-1.5 rounded-full bg-white/50"
                                    />
                                ))}
                            </div>
                            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-medium text-white pointer-events-none z-10">
                                {media.length} items
                            </div>
                        </div>
                    )}

                    {/* Heart animation overlay */}
                    <AnimatePresence>
                        {showHeartAnimation && <HeartAnimation />}
                    </AnimatePresence>
                </div>
            )}

            {/* Post Stats */}
            <div className="px-4 py-2 border-t border-[var(--border-light)] flex justify-between text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                    <Heart className={cn("w-3 h-3", isLiked && "fill-red-500 text-red-500")} />
                    {likes} likes
                </span>
                <span>{post.comments.length} comments • {post.shares} shares</span>
            </div>

            {/* Post Actions */}
            <div className="px-4 py-2 flex justify-around border-b border-[var(--border-light)]">
                <button
                    onClick={handleLike}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm",
                        isLiked
                            ? "text-red-500"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                >
                    <Heart className={cn("w-5 h-5 transition-transform", isLiked && "fill-current scale-110")} />
                    <span className="hidden sm:inline">Like</span>
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Comment</span>
                </button>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                >
                    <Share2 className="w-5 h-5" />
                    <span className="hidden sm:inline">Share</span>
                </button>
                <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm",
                        isSaved
                            ? "text-[var(--warning-color)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                >
                    <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
                </button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-3 space-y-3">
                            {/* Comment input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                                    className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                                />
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={!newComment.trim()}
                                    className="p-2 bg-[var(--accent-blue)] text-white rounded-full disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Existing comments */}
                            {post.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-2">
                                    {comment.authorAvatar ? (
                                        <img
                                            src={comment.authorAvatar}
                                            alt={comment.author}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                                            {comment.author[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 bg-[var(--bg-tertiary)] rounded-2xl px-3 py-2">
                                        <p className="text-xs font-semibold text-[var(--text-primary)]">{comment.author}</p>
                                        <p className="text-xs text-[var(--text-secondary)]">{comment.content}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] mt-1">{comment.time} • {comment.likes} likes</p>
                                    </div>
                                </div>
                            ))}

                            {post.comments.length === 0 && (
                                <p className="text-center text-xs text-[var(--text-muted)] py-2">No comments yet</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard >
    )
}
