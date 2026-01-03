"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { X, Camera, ExternalLink } from "lucide-react"
import { PICLeaderboardSidebar } from "./pic-leaderboard-sidebar"

// Static safety moments data with Unsplash images
const SAFETY_MOMENTS = [
    {
        id: "safety-1",
        title: "PPE Compliance Check",
        category: "Personal Safety",
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
        description: "Team conducting morning PPE inspection before field work"
    },
    {
        id: "safety-2",
        title: "Emergency Drill",
        category: "Emergency Response",
        imageUrl: "https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?w=400&h=300&fit=crop",
        description: "Quarterly fire drill and evacuation exercise"
    },
    {
        id: "safety-3",
        title: "Toolbox Meeting",
        category: "Communication",
        imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop",
        description: "Daily safety briefing with field crew"
    },
    {
        id: "safety-4",
        title: "Safety Signage",
        category: "Workplace Safety",
        imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
        description: "Updated hazard signage installation"
    }
]

export function RightSidebar() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const selectedItem = SAFETY_MOMENTS.find(item => item.id === selectedId)

    return (
        <>
            {/* Sidebar */}
            <div className="w-[280px] space-y-4">
                {/* PIC Leaderboard */}
                <PICLeaderboardSidebar
                    year={new Date().getFullYear()}
                    maxItems={5}
                />

                {/* Header */}
                <div className="flex items-center gap-2 px-1">
                    <Camera className="w-5 h-5 text-[var(--accent-blue)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">Safety Moments</h3>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {SAFETY_MOMENTS.map((item) => (
                        <motion.div
                            key={item.id}
                            layoutId={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className="cursor-pointer rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-sm hover:shadow-lg transition-shadow"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-20 object-cover"
                                layoutId={`img-${item.id}`}
                            />
                            <div className="p-2">
                                <motion.p
                                    layoutId={`title-${item.id}`}
                                    className="text-xs font-medium text-[var(--text-primary)] truncate"
                                >
                                    {item.title}
                                </motion.p>
                                <motion.span
                                    layoutId={`category-${item.id}`}
                                    className="text-[10px] text-[var(--text-muted)]"
                                >
                                    {item.category}
                                </motion.span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* View All Link */}
                <button className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
                    <span>View Gallery</span>
                    <ExternalLink className="w-4 h-4" />
                </button>
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {selectedId && selectedItem && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Expanded Card */}
                        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                            <motion.div
                                layoutId={selectedId}
                                className="bg-[var(--bg-secondary)] rounded-2xl overflow-hidden max-w-md w-full shadow-2xl pointer-events-auto"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Image */}
                                <motion.img
                                    layoutId={`img-${selectedId}`}
                                    src={selectedItem.imageUrl}
                                    alt={selectedItem.title}
                                    className="w-full h-56 object-cover"
                                />

                                {/* Content */}
                                <div className="p-5">
                                    <motion.h3
                                        layoutId={`title-${selectedId}`}
                                        className="text-lg font-bold text-[var(--text-primary)] mb-1"
                                    >
                                        {selectedItem.title}
                                    </motion.h3>
                                    <motion.span
                                        layoutId={`category-${selectedId}`}
                                        className="inline-block px-2 py-0.5 text-xs bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-full mb-3"
                                    >
                                        {selectedItem.category}
                                    </motion.span>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-sm text-[var(--text-secondary)] leading-relaxed"
                                    >
                                        {selectedItem.description}
                                    </motion.p>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4">
                                        <button className="flex-1 py-2 bg-[var(--accent-blue)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-dark)] transition-colors">
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => setSelectedId(null)}
                                            className="px-4 py-2 border border-[var(--border-light)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
