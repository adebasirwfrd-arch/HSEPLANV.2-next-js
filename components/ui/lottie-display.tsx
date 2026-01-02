"use client"

import dynamic from "next/dynamic"

// Dynamically import Lottie to avoid SSR issues
const Player = dynamic(
    () => import("react-lottie-player").then((mod) => mod.default),
    { ssr: false }
)

// Local Lottie animation files - using local files to avoid CDN 403 errors
const LOTTIE_URLS = {
    loading: "/lottie/loading.json",
    success: "/lottie/success.json",
    empty: "/lottie/empty.json"
}

interface LottieDisplayProps {
    type: 'loading' | 'success' | 'empty'
    className?: string
    loop?: boolean
}

export function LottieDisplay({
    type,
    className = "",
    loop = true
}: LottieDisplayProps) {
    const url = LOTTIE_URLS[type]

    return (
        <div className={className}>
            <Player
                loop={loop}
                play
                path={url}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    )
}
