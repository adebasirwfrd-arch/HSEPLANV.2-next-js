"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { PageTransition, PageHeader, PageContent } from "@/components/ui/page-transition"
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
    Share2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Static trending topics data
const TRENDING_TOPICS = [
    { id: 1, title: "PPE Compliance", count: 24, icon: Shield },
    { id: 2, title: "Incident Reports", count: 12, icon: AlertTriangle },
    { id: 3, title: "Safety Training", count: 18, icon: Users },
    { id: 4, title: "Toolbox Meetings", count: 31, icon: MessageSquare },
]

// Safety guidelines
const SAFETY_GUIDELINES = [
    "Always wear appropriate PPE",
    "Report hazards immediately",
    "Attend daily safety briefings",
    "Follow emergency procedures",
    "Keep work areas clean",
]

// Demo posts for fallback mode
const DEMO_POSTS = [
    {
        id: 1,
        author: "Safety Officer",
        avatar: "🦺",
        time: "2 hours ago",
        content: "Great job team! Zero incidents this week. Let's keep up the excellent safety culture! 🎉",
        likes: 15,
        comments: 3
    },
    {
        id: 2,
        author: "HSE Manager",
        avatar: "👷",
        time: "5 hours ago",
        content: "Reminder: Monthly safety inspection scheduled for next Monday. Please ensure all areas are compliant with PPE requirements.",
        likes: 8,
        comments: 2
    },
    {
        id: 3,
        author: "Field Supervisor",
        avatar: "🔧",
        time: "Yesterday",
        content: "Completed toolbox talk on ladder safety this morning. Great participation from the crew! 👏",
        likes: 22,
        comments: 5
    },
    {
        id: 4,
        author: "Training Coordinator",
        avatar: "📚",
        time: "2 days ago",
        content: "New fire safety training module now available. All personnel must complete by end of month.",
        likes: 12,
        comments: 1
    }
]

// Demo Post Component
function DemoPost({ post }: { post: typeof DEMO_POSTS[0] }) {
    const [liked, setLiked] = useState(false)
    const [likes, setLikes] = useState(post.likes)

    const handleLike = () => {
        setLiked(!liked)
        setLikes(liked ? likes - 1 : likes + 1)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[var(--bg-tertiary)] rounded-xl"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] rounded-full flex items-center justify-center text-xl">
                    {post.avatar}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">{post.author}</span>
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.time}
                        </span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] mt-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-blue)]'
                                }`}
                        >
                            <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                            {likes}
                        </button>
                        <button className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments}
                        </button>
                        <button className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors">
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Demo Status Update Form
function DemoStatusForm({ onPost }: { onPost: (content: string) => void }) {
    const [content, setContent] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (content.trim()) {
            onPost(content)
            setContent("")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a safety update, tip, or observation..."
                className="w-full p-3 bg-[var(--bg-tertiary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 resize-none"
                rows={3}
            />
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={!content.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                    <Send className="w-4 h-4" />
                    Post Update
                </button>
            </div>
        </form>
    )
}

export default function CommunityPage() {
    const [posts, setPosts] = useState(DEMO_POSTS)

    const handleNewPost = (content: string) => {
        const newPost = {
            id: Date.now(),
            author: "You",
            avatar: "👤",
            time: "Just now",
            content,
            likes: 0,
            comments: 0
        }
        setPosts([newPost, ...posts])
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
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">HSE Community</h1>
                        <p className="text-xs text-[var(--text-muted)]">Share safety moments & updates</p>
                    </div>
                </PageHeader>

                {/* Demo Mode Banner */}
                <GlassCard className="p-3 bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/30">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--accent-blue)]" />
                        <p className="text-sm text-[var(--text-primary)]">
                            <span className="font-semibold">Demo Mode:</span> Community features work in local demo mode. Connect Stream.io for full functionality.
                        </p>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Feed Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Status Update Form */}
                        <GlassCard className="p-4">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[var(--accent-blue)]" />
                                Share an Update
                            </h3>
                            <DemoStatusForm onPost={handleNewPost} />
                        </GlassCard>

                        {/* Activity Feed */}
                        <GlassCard className="p-4">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[var(--success-color)]" />
                                Activity Feed
                            </h3>
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {posts.map((post) => (
                                        <DemoPost key={post.id} post={post} />
                                    ))}
                                </AnimatePresence>
                            </div>
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

                        {/* Safety Guidelines */}
                        <GlassCard className="p-4">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[var(--success-color)]" />
                                Safety Guidelines
                            </h3>
                            <ul className="space-y-2">
                                {SAFETY_GUIDELINES.map((guideline, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
                                    >
                                        <Heart className="w-3 h-3 text-[var(--danger-color)]" />
                                        {guideline}
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>

                        {/* Community Stats */}
                        <GlassCard className="p-4">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4 text-[var(--accent-purple)]" />
                                Community Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                                    <div className="text-2xl font-bold text-[var(--accent-blue)]">156</div>
                                    <div className="text-xs text-[var(--text-muted)]">Members</div>
                                </div>
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                                    <div className="text-2xl font-bold text-[var(--success-color)]">42</div>
                                    <div className="text-xs text-[var(--text-muted)]">Posts Today</div>
                                </div>
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                                    <div className="text-2xl font-bold text-[var(--accent-purple)]">89</div>
                                    <div className="text-xs text-[var(--text-muted)]">Safety Tips</div>
                                </div>
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-center">
                                    <div className="text-2xl font-bold text-[var(--warning-color)]">7</div>
                                    <div className="text-xs text-[var(--text-muted)]">Days Streak</div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </PageTransition>
        </AppShell>
    )
}
