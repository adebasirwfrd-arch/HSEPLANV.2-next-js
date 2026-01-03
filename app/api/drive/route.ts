import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'
import { createClient } from '@/lib/supabase/server'

// Google Drive target folder ID
const DRIVE_FOLDER_ID = '1REObWt8IAvIATcWc9Hr2b546grVlPK6x'

// Initialize Google Drive API with user OAuth credentials
async function getDriveClientWithRefresh(
    accessToken: string,
    refreshToken: string | undefined,
    userId: string,
    supabase: ReturnType<typeof import('@/lib/supabase/server').createClient> extends Promise<infer T> ? T : never
) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    })

    // Listen for token refresh events and save new tokens
    oauth2Client.on('tokens', async (tokens) => {
        console.log('Google tokens refreshed')
        if (tokens.access_token) {
            try {
                await (supabase as any).from('user_settings').upsert({
                    user_id: userId,
                    google_access_token: tokens.access_token,
                    google_refresh_token: tokens.refresh_token || refreshToken,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' })
                console.log('New tokens saved to database')
            } catch (e) {
                console.error('Failed to save refreshed tokens:', e)
            }
        }
    })

    // Force token refresh if needed
    try {
        await oauth2Client.getAccessToken()
    } catch (e) {
        console.error('Token refresh failed:', e)
        throw new Error('Google token expired. Please reconnect your Google account.')
    }

    return google.drive({ version: 'v3', auth: oauth2Client })
}

// Find or create folder by name
async function findOrCreateFolder(drive: ReturnType<typeof google.drive>, folderName: string, parentId: string): Promise<string> {
    // Search for existing folder
    const searchRes = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
        fields: 'files(id, name)',
    })

    if (searchRes.data.files && searchRes.data.files.length > 0) {
        return searchRes.data.files[0].id!
    }

    // Create new folder
    const createRes = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        },
        fields: 'id',
    })

    return createRes.data.id!
}

export async function POST(request: NextRequest) {
    try {
        // Get user's Google OAuth tokens from Supabase
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: settings } = await supabase
            .from('user_settings')
            .select('google_access_token, google_refresh_token')
            .eq('user_id', user.id)
            .maybeSingle() as { data: { google_access_token: string | null; google_refresh_token: string | null } | null }

        if (!settings?.google_access_token) {
            return NextResponse.json({
                error: 'Google not connected. Please connect your Google account first.',
                needsAuth: true
            }, { status: 400 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const programName = formData.get('programName') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!programName) {
            return NextResponse.json({ error: 'Program name required' }, { status: 400 })
        }

        const drive = await getDriveClientWithRefresh(
            settings.google_access_token,
            settings.google_refresh_token ?? undefined,
            user.id,
            supabase
        )

        // Find or create program folder
        const programFolderId = await findOrCreateFolder(drive, programName, DRIVE_FOLDER_ID)

        // Upload file to program folder
        const buffer = Buffer.from(await file.arrayBuffer())
        const stream = Readable.from(buffer)

        const uploadRes = await drive.files.create({
            requestBody: {
                name: file.name,
                parents: [programFolderId],
            },
            media: {
                mimeType: file.type || 'application/octet-stream',
                body: stream,
            },
            fields: 'id, name, webViewLink, webContentLink',
        })

        // Make file accessible via link
        await drive.permissions.create({
            fileId: uploadRes.data.id!,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        })

        return NextResponse.json({
            success: true,
            file: {
                id: uploadRes.data.id,
                filename: uploadRes.data.name,
                driveFileId: uploadRes.data.id,
                driveUrl: uploadRes.data.webViewLink,
                uploadedAt: new Date().toISOString(),
            }
        })
    } catch (error) {
        console.error('Drive upload error:', error)
        return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 })
    }
}
