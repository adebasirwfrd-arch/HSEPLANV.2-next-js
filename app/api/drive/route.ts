import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

// Google Drive target folder ID
const DRIVE_FOLDER_ID = '1REObWt8IAvIATcWc9Hr2b546grVlPK6x'

// Service account credentials
const credentials = {
    type: "service_account",
    project_id: "csms-drive-service",
    private_key_id: "2e5abf6d60b684a9218a4526d8256b9b01b7cb31",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDhz6MPlvFB2CHz\neik8YZoBe74LfBY7awmhfeLFgimoA47htx+EleDVF+xWLIAt4TuE8ylGb7yxTCUm\nf7RKJ1szhK+xdpsD/o9oDAgZvQw6UEGO0+Us2hmKNxbCxTgDmDq2rdBpxH7JrhW5\nVzcgphrtMRM3oVxBxjyZZQmzN+m/cdTfjixOSDp3w2xmTPVOzoT7PiWcswUpI9Xo\nAtl3VgafWnF44OgjI6jNs0EusqvIFjB8wX37rqBWcD3LO4G67LwCIujEACVhSIT4\nOFWbmBedZz7jf+l4pInDB7ft9xc4s64wIMG+/3G1a77LfhIZpkJXIzRjXcQ5Hpi9\n760B9zDXAgMBAAECggEAAZDhDfcFmuKRsqomcw5tGNJ/GV9eri3YZ/juomDOD7VB\nfR+0214frE3Vm2q9BpRs4NcRuiCFCoxv6a0nmTxeEuc6LSnBo4ZVHn+tQt07jf7Z\nmqfhNFaAdRRbmbrRWvHTjM8AkNYVrynNAwGLv5pLIDrDdDu1CChg0Hv9NaGt3yLe\nktOUpwsNWl9CR0EQo/A0jquoXRmVx0+7Y+st6a0v6cC1WPM6HqRI85dS8kle4Lt4\nHnKthRs1LpYmUdIqjJkUn7VFV7PAGJI5ld78ISCLNtZEXBsOVP1PBw09mO7LJu5d\ng6hpzkandN6r3KFZqKjD0yS2piZWCWkmPnO4c+8YwQKBgQD5Gv6t1T2rRUw7tqIB\nkwe4ZI/FoMWJWkBjBYO+qPtxhS72b4QxIXsLx3jJp7Gcfu+QUS56fCj27WGkGtuk\nONzPvLzmLnk0LS54oAzNySiO/ILAYmx6a/USJKM+VaSCqrIT46ITZQxSUkjOwumB\nAeK1RfF79qTtkC7zaTuddwlB5wKBgQDoD5fDePt3MAxLy5IjEd2AevtYTWJr79Wf\n9rlgFKmgvVn/CWYpRMyTuJxa86bGRYfXdqZ0JAp6kjcNPudijX3F4l2IRvQP4+PX\nBsgIRvLVcsU4/PdiOee9n4DQbEGt2stSaT2NbZAuTPvcpPxF4NG+U7f9BO3RK3Hk\nAxH0+F6bkQKBgAYzDMmIuAsuI1KNHgUKArQtFILnmGLtsxKDzZ6OGAvgM6YAanrK\niYRmh3QFT19ErXObAZwcwOw8RiTOYk74903YNZ9I4s1Qnopz+T2Z1v+P+zUMfgSh\n8Sxtav6fJQP3eY0TKjJvXloiIBu9MBB82oaGYhcisUIUR4bZRJmLn9hbAoGAbrMZ\ng27QDnBGPVXz9XTNRD/mbJ4lqDW1o2RP0+ynan1JVCcIrAEc0g8LzztRwF1kyrzX\n9KlIsmXTiycJu/KhH+e3FI48WOQuSOH8RC6MIpRoTqIl5J6Y1NUk3sf1oNixizOW\n4EN2tw+UShIOIct4YqGPMEzMoa5m2w034LMmdnECgYAobvTE9kXN0lE9+Wh3qiFg\np/59tPtRQKZVBhWp6ot13nhnRz7g9AI+X1WibZCAs+EuXkg1/cpGoaDllcv3J97r\nlSS8rigfzyEs1fXFAvfT/fdxwFtMSEwaVOEwGLho9Ei03CjLpJmgfjOIQzbff/7+\nGL4aD4wcnh/HcEgzBt4hWQ==\n-----END PRIVATE KEY-----\n",
    client_email: "hse-plan@csms-drive-service.iam.gserviceaccount.com",
    client_id: "100877384604952041218",
}

// Initialize Google Drive API
async function getDriveClient() {
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file']
    })
    return google.drive({ version: 'v3', auth })
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
        const formData = await request.formData()
        const file = formData.get('file') as File
        const programName = formData.get('programName') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!programName) {
            return NextResponse.json({ error: 'Program name required' }, { status: 400 })
        }

        const drive = await getDriveClient()

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
