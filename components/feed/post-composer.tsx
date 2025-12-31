"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Camera, Paperclip, Send } from "lucide-react"

interface PostComposerProps {
    userName?: string
    onPost?: (content: string) => void
}

export function PostComposer({ userName = "User", onPost }: PostComposerProps) {
    const [content, setContent] = useState("")
    const [name, setName] = useState("")
    const [productLine, setProductLine] = useState("")

    const handleSubmit = () => {
        if (content.trim() && onPost) {
            onPost(content)
            setContent("")
        }
    }

    return (
        <GlassCard className="p-4">
            <h4 className="text-sm text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                💬 <span>Share a Comment</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
                <input
                    type="text"
                    placeholder="Product Line"
                    value={productLine}
                    onChange={(e) => setProductLine(e.target.value)}
                    className="bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
            </div>

            <textarea
                placeholder="Write your comment or update..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none min-h-[60px] mb-3 focus:outline-none focus:border-[var(--accent-blue)]"
            />

            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--text-secondary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
                        <Camera className="w-4 h-4" />
                        Photo
                    </button>
                    <button className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--text-secondary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
                        <Paperclip className="w-4 h-4" />
                        File
                    </button>
                </div>
                <button
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white px-6 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                    Post
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </GlassCard>
    )
}
