'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Play, Heart, MessageCircle, ChevronRight, Loader2, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// =====================================================
// Types
// =====================================================

interface SafetyMoment {
    id: string
    title: string
    content: string
    category: string
    author_name: string
    thumbnail_url: string | null
    media: { type: 'image' | 'video'; url: string }[]
    likes_count: number
    comments_count: number
    created_at: string
}

// =====================================================
// Moment Card Component
// =====================================================

function MomentCard({ moment, index, onClick }: { moment: SafetyMoment; index: number; onClick: () => void }) {
    const hasVideo = moment.media?.some(m => m.type === 'video')
    const thumbnailUrl = moment.thumbnail_url || moment.media?.[0]?.url ||
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            onClick={onClick}
            className="relative group cursor-pointer"
        >
            {/* Image/Video Thumbnail */}
            <div className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-tertiary)]">
                <img
                    src={thumbnailUrl}
                    alt={moment.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Video indicator */}
                {hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-medium truncate">{moment.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-white/80 text-[10px]">
                            <span className="flex items-center gap-0.5">
                                <Heart className="w-3 h-3" /> {moment.likes_count}
                            </span>
                            <span className="flex items-center gap-0.5">
                                <MessageCircle className="w-3 h-3" /> {moment.comments_count}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Modal Component
// =====================================================

function MomentModal({ moment, onClose }: { moment: SafetyMoment; onClose: () => void }) {
    const mediaItem = moment.media?.[0]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--bg-secondary)] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Media */}
                <div className="relative aspect-video bg-black">
                    {mediaItem?.type === 'video' ? (
                        <video
                            src={mediaItem.url}
                            controls
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            src={mediaItem?.url || moment.thumbnail_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800'}
                            alt={moment.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <span className="text-xs text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 px-2 py-0.5 rounded-full">
                        {moment.category}
                    </span>
                    <h3 className="font-bold text-[var(--text-primary)] mt-2">{moment.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-3">{moment.content}</p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-light)]">
                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" /> {moment.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" /> {moment.comments_count}
                            </span>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                            By {moment.author_name}
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

interface SafetyMomentsGalleryProps {
    maxItems?: number
    className?: string
}

export function SafetyMomentsGallery({ maxItems = 4, className = '' }: SafetyMomentsGalleryProps) {
    const [moments, setMoments] = useState<SafetyMoment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMoment, setSelectedMoment] = useState<SafetyMoment | null>(null)

    // Fetch moments
    useEffect(() => {
        const fetchMoments = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('safety_moments' as any)
                .select('id, title, content, category, author_name, thumbnail_url, media, likes_count, comments_count, created_at')
                .eq('is_archived', false)
                .order('created_at', { ascending: false })
                .limit(maxItems)

            setMoments((data as SafetyMoment[]) || [])
            setIsLoading(false)
        }

        fetchMoments()

        // Realtime subscription
        const supabase = createClient()
        const channel = supabase
            .channel('safety_moments_gallery')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'safety_moments' },
                () => {
                    // Refetch on any change
                    fetchMoments()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [maxItems])

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-2xl p-4 shadow-lg ${className}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[var(--accent-blue)]" />
                        <h3 className="font-semibold text-sm text-[var(--text-primary)]">Safety Moments</h3>
                    </div>
                    <Link href="/community">
                        <motion.button
                            className="text-[10px] text-[var(--accent-blue)] hover:underline flex items-center gap-0.5"
                            whileHover={{ x: 2 }}
                        >
                            View All
                            <ChevronRight className="w-3 h-3" />
                        </motion.button>
                    </Link>
                </div>

                {/* Gallery Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                    </div>
                ) : moments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                        <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No safety moments yet</p>
                        <Link href="/community">
                            <button className="mt-2 text-[var(--accent-blue)] hover:underline">
                                Create one →
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <AnimatePresence>
                            {moments.map((moment, index) => (
                                <MomentCard
                                    key={moment.id}
                                    moment={moment}
                                    index={index}
                                    onClick={() => setSelectedMoment(moment)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {selectedMoment && (
                    <MomentModal
                        moment={selectedMoment}
                        onClose={() => setSelectedMoment(null)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
