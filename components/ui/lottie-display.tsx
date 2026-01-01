"use client"

import dynamic from "next/dynamic"

// Dynamically import Lottie to avoid SSR issues
const Player = dynamic(
    () => import("react-lottie-player").then((mod) => mod.default),
    { ssr: false }
)

// Lottie animation URLs - using LottieFiles CDN (reliable public URLs)
const LOTTIE_URLS = {
    loading: "https://assets9.lottiefiles.com/packages/lf20_l4ny0juo.json",
    success: "https://assets5.lottiefiles.com/packages/lf20_jbrw3hcz.json",
    empty: "https://assets10.lottiefiles.com/packages/lf20_ydo1amjm.json"
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
