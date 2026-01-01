"use client"

import dynamic from "next/dynamic"

// Dynamically import Lottie to avoid SSR issues
const Player = dynamic(
    () => import("react-lottie-player").then((mod) => mod.default),
    { ssr: false }
)

// Lottie animation URLs
const LOTTIE_URLS = {
    loading: "https://lottie.host/980b3d63-549e-4c76-8806-03f473854580/9y7J8t456y.json",
    success: "https://lottie.host/5a70377c-7833-4f93-a44e-12821703666d/monitor.json",
    empty: "https://lottie.host/8904771c-4389-482a-a92c-554160408542/C15y7J8t45.json"
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
