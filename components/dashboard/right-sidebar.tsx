"use client"

import { PICLeaderboardSidebar } from "./pic-leaderboard-sidebar"
import { UpcomingEventsCard } from "./upcoming-events-card"
import { SafetyMomentsGallery } from "./safety-moments-gallery"
import { RecentActivitySidebar } from "./recent-activity-sidebar"

export function RightSidebar() {
    return (
        <div className="w-[280px] space-y-4">
            {/* Upcoming Events */}
            <UpcomingEventsCard maxItems={5} />

            {/* Safety Moments Gallery - Realtime from Supabase */}
            <SafetyMomentsGallery maxItems={4} />

            {/* PIC Leaderboard */}
            <PICLeaderboardSidebar
                year={new Date().getFullYear()}
                maxItems={5}
            />

            {/* Recent Activity - Admin Only */}
            <RecentActivitySidebar maxItems={5} />
        </div>
    )
}
