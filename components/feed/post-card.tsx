"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface CommentData {
    id: string
    author: string
    content: string
    time: string
    likes: number
}

export interface PostData {
    id: string
    author: string
    authorRole: string
    time: string
    content: string
    image?: string
    likes: number
    comments: CommentData[]
    shares: number
    isLiked?: boolean
    isSaved?: boolean
}

interface PostCardProps {
    post: PostData
}

export function PostCard({ post }: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.isLiked || false)
    const [isSaved, setIsSaved] = useState(post.isSaved || false)
    const [showComments, setShowComments] = useState(false)
    const [likes, setLikes] = useState(post.likes)

    const handleLike = () => {
        setIsLiked(!isLiked)
        setLikes(prev => isLiked ? prev - 1 : prev + 1)
    }

    const initials = post.author.split(' ').map(n => n[0]).join('').slice(0, 2)

    return (
        <GlassCard className="overflow-hidden">
            {/* Post Header */}
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] flex items-center justify-center text-white font-bold text-sm">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--text-primary)] truncate">{post.author}</p>
                        <p className="text-xs text-[var(--text-muted)]">{post.authorRole} • {post.time}</p>
                    </div>
                </div>

                {/* Post Content */}
                <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
                    {post.content}
                </p>
            </div>

            {/* Post Image */}
            {post.image && (
                <div className="relative w-full h-48 bg-[var(--bg-tertiary)]">
                    <Image
                        src={post.image}
                        alt="Post image"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            )}

            {/* Post Stats */}
            <div className="px-4 py-2 border-t border-b border-[var(--border-light)] flex justify-between text-xs text-[var(--text-muted)]">
                <span>{likes} likes</span>
                <span>{post.comments.length} comments • {post.shares} shares</span>
            </div>

            {/* Post Actions */}
            <div className="px-4 py-3 flex justify-around">
                <button
                    onClick={handleLike}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm",
                        isLiked
                            ? "text-[var(--danger-color)] bg-red-50"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                >
                    <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                    Like
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                >
                    <MessageCircle className="w-5 h-5" />
                    Comment
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm">
                    <Share2 className="w-5 h-5" />
                    Share
                </button>
                <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm",
                        isSaved
                            ? "text-[var(--warning-color)] bg-amber-50"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                >
                    <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
                </button>
            </div>

            {/* Comments Section */}
            {showComments && post.comments.length > 0 && (
                <div className="px-4 pb-4 border-t border-[var(--border-light)]">
                    <div className="mt-3 space-y-3">
                        {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                                    {comment.author[0]}
                                </div>
                                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-xl px-3 py-2">
                                    <p className="text-xs font-semibold text-[var(--text-primary)]">{comment.author}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{comment.content}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{comment.time} • {comment.likes} likes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </GlassCard>
    )
}
