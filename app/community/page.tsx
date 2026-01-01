"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { LottieDisplay } from "@/components/ui/lottie-display"
import { PageTransition, PageHeader, PageContent } from "@/components/ui/page-transition"
import {
    MessageSquare,
    TrendingUp,
    Shield,
    Users,
    FileText,
    AlertTriangle,
    Heart
} from "lucide-react"

// Import Stream CSS
import "react-activity-feed/dist/index.css"

// Dynamically import Stream components to avoid SSR issues
const StreamApp = dynamic(
    () => import("react-activity-feed").then((mod) => mod.StreamApp),
    { ssr: false }
)
const FlatFeed = dynamic(
    () => import("react-activity-feed").then((mod) => mod.FlatFeed),
    { ssr: false }
)
const StatusUpdateForm = dynamic(
    () => import("react-activity-feed").then((mod) => mod.StatusUpdateForm),
    { ssr: false }
)
const Activity = dynamic(
    () => import("react-activity-feed").then((mod) => mod.Activity),
    { ssr: false }
)

interface StreamCredentials {
    token: string
    apiKey: string
    appId: string
    userId: string
}

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

export default function CommunityPage() {
    const [credentials, setCredentials] = useState<StreamCredentials | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCredentials = async () => {
            try {
                const response = await fetch("/api/stream-token")
                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || "Failed to fetch credentials")
                }
                const data = await response.json()
                setCredentials(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCredentials()
    }, [])

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

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <LottieDisplay type="loading" className="w-32 h-32" />
                        <p className="text-sm text-[var(--text-muted)] mt-4">Connecting to community...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <GlassCard className="p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-[var(--danger-color)] mx-auto mb-3" />
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2">Connection Error</h3>
                        <p className="text-sm text-[var(--text-muted)]">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg text-sm"
                        >
                            Retry
                        </button>
                    </GlassCard>
                )}

                {/* Stream Feed Content */}
                {credentials && !loading && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Feed Column */}
                        <div className="lg:col-span-2 space-y-4">
                            <StreamApp
                                apiKey={credentials.apiKey}
                                appId={credentials.appId}
                                token={credentials.token}
                            >
                                {/* Status Update Form */}
                                <GlassCard className="p-4">
                                    <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[var(--accent-blue)]" />
                                        Share an Update
                                    </h3>
                                    <div className="stream-status-form">
                                        <StatusUpdateForm
                                            feedGroup="user"
                                            userId={credentials.userId}
                                        />
                                    </div>
                                </GlassCard>

                                {/* Activity Feed */}
                                <GlassCard className="p-4">
                                    <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-[var(--success-color)]" />
                                        Activity Feed
                                    </h3>
                                    <div className="stream-feed">
                                        <FlatFeed
                                            feedGroup="user"
                                            userId={credentials.userId}
                                            Activity={(props: any) => (
                                                <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-xl">
                                                    <Activity {...props} />
                                                </div>
                                            )}
                                            notify
                                        />
                                    </div>
                                </GlassCard>
                            </StreamApp>
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
                                            className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                                        >
                                            <span className="w-5 h-5 bg-[var(--success-color)]/10 text-[var(--success-color)] rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                                                {idx + 1}
                                            </span>
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
                                    <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="text-2xl font-bold text-[var(--accent-blue)]">156</div>
                                        <div className="text-xs text-[var(--text-muted)]">Members</div>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="text-2xl font-bold text-[var(--success-color)]">42</div>
                                        <div className="text-xs text-[var(--text-muted)]">Posts Today</div>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="text-2xl font-bold text-[var(--warning-color)]">128</div>
                                        <div className="text-xs text-[var(--text-muted)]">Reactions</div>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="text-2xl font-bold text-[var(--accent-purple)]">18</div>
                                        <div className="text-xs text-[var(--text-muted)]">Topics</div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                )}
            </PageTransition>

            {/* Custom styles for Stream components */}
            <style jsx global>{`
        .stream-status-form .raf-panel-header {
          display: none;
        }
        .stream-status-form textarea {
          background: var(--bg-tertiary) !important;
          border: 1px solid var(--border-light) !important;
          border-radius: 12px !important;
          color: var(--text-primary) !important;
          padding: 12px !important;
        }
        .stream-status-form button[type="submit"] {
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-sky)) !important;
          border-radius: 8px !important;
        }
        .stream-feed .raf-card {
          background: transparent !important;
          border: none !important;
        }
        .stream-feed img {
          border-radius: 12px !important;
          max-width: 100% !important;
        }
        .raf-activity {
          background: transparent !important;
        }
        .raf-user-bar__username {
          color: var(--text-primary) !important;
        }
        .raf-activity__content {
          color: var(--text-secondary) !important;
        }
      `}</style>
        </AppShell>
    )
}
