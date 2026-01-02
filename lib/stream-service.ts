/**
 * Stream.io Service - Client-side with self-healing
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

    private async fetchToken(): Promise<StreamTokenResponse | null> {
        try {
            const response = await fetch('/api/stream-token')
            if (!response.ok) {
                const errorData = await response.json()
                console.error('[Stream] Token error:', errorData.error)
                return null
            }
            return await response.json()
        } catch {
            return null
        }
    }

    async connect(): Promise<boolean> {
        if (this.state.isConnecting) return false
        if (this.state.isConnected && this.state.client) return true

        this.state.isConnecting = true

        try {
            this.tokenData = await this.fetchToken()
            if (!this.tokenData) throw new Error('Failed to get token')

            // Connect with Singapore region - browser: true for client-side
            this.state.client = new StreamClient(
                this.tokenData.apiKey,
                this.tokenData.token,
                this.tokenData.appId,
                {
                    browser: true,
                    location: 'singapore',
                    group: 'singapore', // Fixes 'location=unspecified' query param
                    // Force Singapore API URL as a fallback/guarantee
                    urlOverride: {
                        api: 'https://singapore-api.stream-io-api.com/api/'
                    }
                }
            )

            this.state.user = this.tokenData.user
            this.state.isConnected = true
            this.state.retryCount = 0

            // Ensure timeline follows user so their own posts appear
            try {
                const timeline = this.state.client.feed('timeline', this.tokenData.userId)
                await timeline.follow('user', this.tokenData.userId)
            } catch (e) {
                console.error('[Stream] Follow error:', e)
            }

            this.notifyListeners(true)

            return true
        } catch {
            this.state.isConnected = false
            this.state.retryCount++

            if (this.state.retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, this.state.retryCount - 1)
                setTimeout(() => {
                    this.state.isConnecting = false
                    this.connect()
                }, delay)
            }

            return false
        } finally {
            this.state.isConnecting = false
        }
    }

    async getFeed(feedGroup: string, userId?: string): Promise<StreamFeed | null> {
        const connected = await this.ensureConnected()
        if (!connected || !this.state.client) return null

        const targetUserId = userId || this.state.user?.id
        if (!targetUserId) return null

        try {
            return this.state.client.feed(feedGroup, targetUserId)
        } catch {
            return null
        }
    }

    async getTimelineFeed(): Promise<StreamFeed | null> {
        return this.getFeed('timeline')
    }

    async getNotificationFeed(): Promise<StreamFeed | null> {
        return this.getFeed('notification')
    }

    async getUserFeed(): Promise<StreamFeed | null> {
        return this.getFeed('user')
    }

    async post(activity: {
        content: string
        category?: string
        attachments?: string[]
        files?: File[]
    }): Promise<boolean> {
        try {
            const feed = await this.getUserFeed()
            if (!feed) return false

            const userId = this.state.user?.id
            if (!userId) return false

            // Handle file uploads
            const uploadedUrls: string[] = []
            if (activity.files && activity.files.length > 0) {
                for (const file of activity.files) {
                    try {
                        let url: string | null = null
                        if (file.type.startsWith('image/')) {
                            const response = await this.state.client?.images.upload(file)
                            url = response?.file || null
                        } else {
                            const response = await this.state.client?.files.upload(file)
                            url = response?.file || null
                        }
                        if (url) uploadedUrls.push(url)
                    } catch (e) {
                        console.error('[Stream] File upload failed:', e)
                    }
                }
            }

            const allAttachments = [...(activity.attachments || []), ...uploadedUrls]

            await feed.addActivity({
                verb: 'post',
                object: activity.content,
                content: activity.content,
                category: activity.category,
                attachments: allAttachments,
                time: new Date().toISOString()
            } as any)

            return true
        } catch (error: any) {
            console.error('[Stream] Post Error:', error.response?.data?.detail || error.message || 'Unknown error');
            return false
        }
    }

    async getTimelineActivities(options: { limit?: number; refresh?: boolean } = {}) {
        try {
            if (!this.state.client || !this.tokenData) return []

            const feed = this.state.client.feed('timeline', this.tokenData.userId)
            const response = await feed.get({
                limit: options.limit || 25,
                enrich: true
            })
            return response.results || []
        } catch (error: any) {
            console.error('[Stream] GetTimeline Error:', error.response?.data?.detail || error.message || 'Unknown error');
            return []
        }
    }

    async deleteActivity(activityId: string): Promise<boolean> {
        try {
            const feed = await this.getUserFeed()
            if (!feed) return false

            await feed.removeActivity(activityId)
            return true
        } catch (error) {
            console.error('[Stream] Delete Error:', error)
            return false
        }
    }

    async getUnreadCount(): Promise<number> {
        try {
            const feed = await this.getNotificationFeed()
            if (!feed) return 0
            const response = await feed.get({ limit: 1, mark_seen: false })
            return response.unread || 0
        } catch {
            return 0
        }
    }

    async markNotificationsAsSeen(): Promise<void> {
        try {
            const feed = await this.getNotificationFeed()
            if (feed) await feed.get({ limit: 1, mark_seen: true })
        } catch {
            // Silent
        }
    }

    async subscribe(
        feedGroup: string,
        callback: (data: unknown) => void
    ): Promise<(() => void) | null> {
        const feed = await this.getFeed(feedGroup)
        if (!feed) return null

        try {
            const subscription = await feed.subscribe(callback)
            return () => subscription.cancel()
        } catch {
            return null
        }
    }

    onConnectionChange(listener: (connected: boolean) => void): () => void {
        this.connectionListeners.add(listener)
        listener(this.state.isConnected)
        return () => this.connectionListeners.delete(listener)
    }

    getUser(): StreamUser | null {
        return this.state.user
    }

    isConnected(): boolean {
        return this.state.isConnected
    }

    disconnect(): void {
        this.state.client = null
        this.state.user = null
        this.state.isConnected = false
        this.tokenData = null
        this.notifyListeners(false)
    }

    private async ensureConnected(): Promise<boolean> {
        if (this.state.isConnected && this.state.client) return true
        return this.connect()
    }

    private notifyListeners(connected: boolean): void {
        this.connectionListeners.forEach(listener => {
            try { listener(connected) } catch { /* silent */ }
        })
    }
}

export const streamService = new StreamService()
export type { StreamUser, StreamTokenResponse }
