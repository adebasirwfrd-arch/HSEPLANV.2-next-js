/**
 * Stream.io Service - Client-side service with self-healing capabilities
 * 
 * Features:
 * - Automatic retry on connection failure
 * - Silent error handling (no user popups)
 * - Token refresh on expiration
 * - Real-time connection management
 */

import { connect, StreamClient, StreamFeed } from 'getstream'

interface StreamUser {
    id: string
    name: string
    image?: string
    email?: string
}

interface StreamTokenResponse {
    token: string
    apiKey: string
    appId: string
    userId: string
    user: StreamUser
}

interface StreamServiceState {
    client: StreamClient | null
    user: StreamUser | null
    isConnected: boolean
    isConnecting: boolean
    retryCount: number
}

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

class StreamService {
    private state: StreamServiceState = {
        client: null,
        user: null,
        isConnected: false,
        isConnecting: false,
        retryCount: 0
    }

    private tokenData: StreamTokenResponse | null = null
    private connectionListeners: Set<(connected: boolean) => void> = new Set()

    /**
     * Get Stream token from our API (which handles identity sync)
     */
    private async fetchToken(): Promise<StreamTokenResponse | null> {
        try {
            const response = await fetch('/api/stream-token')

            if (!response.ok) {
                const error = await response.json()
                console.error('[StreamService] Token fetch failed:', error)
                return null
            }

            return await response.json()
        } catch (error) {
            console.error('[StreamService] Token fetch error:', error)
            return null
        }
    }

    /**
     * Initialize or reconnect the Stream client
     * Automatically retries on failure without user-facing errors
     */
    async connect(): Promise<boolean> {
        if (this.state.isConnecting) {
            return false
        }

        if (this.state.isConnected && this.state.client) {
            return true
        }

        this.state.isConnecting = true

        try {
            // Fetch token (this also syncs identity on server side)
            this.tokenData = await this.fetchToken()

            if (!this.tokenData) {
                throw new Error('Failed to get token')
            }

            // Initialize client
            this.state.client = connect(
                this.tokenData.apiKey,
                this.tokenData.token,
                this.tokenData.appId
            )

            this.state.user = this.tokenData.user
            this.state.isConnected = true
            this.state.retryCount = 0

            console.log('[StreamService] Connected successfully')
            this.notifyListeners(true)

            return true
        } catch (error) {
            console.error('[StreamService] Connection failed:', error)

            this.state.isConnected = false
            this.state.retryCount++

            // Auto-retry with exponential backoff (silent, no user popup)
            if (this.state.retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, this.state.retryCount - 1)
                console.log(`[StreamService] Retrying in ${delay}ms (attempt ${this.state.retryCount}/${MAX_RETRIES})`)

                setTimeout(() => {
                    this.state.isConnecting = false
                    this.connect()
                }, delay)
            } else {
                console.error('[StreamService] Max retries reached, giving up')
            }

            return false
        } finally {
            this.state.isConnecting = false
        }
    }

    /**
     * Get a feed with automatic reconnection
     */
    async getFeed(feedGroup: string, userId?: string): Promise<StreamFeed | null> {
        const connected = await this.ensureConnected()

        if (!connected || !this.state.client) {
            return null
        }

        const targetUserId = userId || this.state.user?.id
        if (!targetUserId) {
            return null
        }

        try {
            return this.state.client.feed(feedGroup, targetUserId)
        } catch (error) {
            console.error(`[StreamService] Failed to get ${feedGroup} feed:`, error)
            return null
        }
    }

    /**
     * Get timeline feed for the current user
     */
    async getTimelineFeed(): Promise<StreamFeed | null> {
        return this.getFeed('timeline')
    }

    /**
     * Get notification feed for the current user
     */
    async getNotificationFeed(): Promise<StreamFeed | null> {
        return this.getFeed('notification')
    }

    /**
     * Get user feed for posting
     */
    async getUserFeed(): Promise<StreamFeed | null> {
        return this.getFeed('user')
    }

    /**
     * Post an activity to the user's feed
     */
    async post(activity: {
        content: string
        category?: string
        attachments?: string[]
    }): Promise<boolean> {
        try {
            const feed = await this.getUserFeed()
            if (!feed) return false

            await feed.addActivity({
                actor: `user:${this.state.user?.id}`,
                verb: 'post',
                object: activity.content,
                content: activity.content,
                category: activity.category,
                attachments: activity.attachments,
                time: new Date().toISOString()
            })

            console.log('[StreamService] Post created successfully')
            return true
        } catch (error) {
            console.error('[StreamService] Failed to create post:', error)
            return false
        }
    }

    /**
     * Get unread notification count (for bell badge)
     */
    async getUnreadCount(): Promise<number> {
        try {
            const feed = await this.getNotificationFeed()
            if (!feed) return 0

            const response = await feed.get({ limit: 1, mark_seen: false })
            return response.unread || 0
        } catch (error) {
            console.error('[StreamService] Failed to get unread count:', error)
            return 0
        }
    }

    /**
     * Mark notifications as seen
     */
    async markNotificationsAsSeen(): Promise<void> {
        try {
            const feed = await this.getNotificationFeed()
            if (!feed) return

            await feed.get({ limit: 1, mark_seen: true })
            console.log('[StreamService] Notifications marked as seen')
        } catch (error) {
            console.error('[StreamService] Failed to mark notifications as seen:', error)
        }
    }

    /**
     * Subscribe to real-time updates
     */
    async subscribe(
        feedGroup: string,
        callback: (data: unknown) => void
    ): Promise<(() => void) | null> {
        const feed = await this.getFeed(feedGroup)
        if (!feed) return null

        try {
            const subscription = await feed.subscribe(callback)
            return () => subscription.cancel()
        } catch (error) {
            console.error(`[StreamService] Failed to subscribe to ${feedGroup}:`, error)
            return null
        }
    }

    /**
     * Add connection state listener
     */
    onConnectionChange(listener: (connected: boolean) => void): () => void {
        this.connectionListeners.add(listener)
        // Immediately notify of current state
        listener(this.state.isConnected)

        return () => {
            this.connectionListeners.delete(listener)
        }
    }

    /**
     * Get current user
     */
    getUser(): StreamUser | null {
        return this.state.user
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.state.isConnected
    }

    /**
     * Disconnect and cleanup
     */
    disconnect(): void {
        this.state.client = null
        this.state.user = null
        this.state.isConnected = false
        this.tokenData = null
        this.notifyListeners(false)
    }

    private async ensureConnected(): Promise<boolean> {
        if (this.state.isConnected && this.state.client) {
            return true
        }
        return this.connect()
    }

    private notifyListeners(connected: boolean): void {
        this.connectionListeners.forEach(listener => {
            try {
                listener(connected)
            } catch (e) {
                console.error('[StreamService] Listener error:', e)
            }
        })
    }
}

// Singleton instance
export const streamService = new StreamService()

// Export types
export type { StreamUser, StreamTokenResponse }
