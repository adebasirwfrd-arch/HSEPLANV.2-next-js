import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/drive.file'  // For file uploads to Google Drive
        ],
        prompt: 'consent' // Penting agar mendapatkan Refresh Token
    });
};

export const getGoogleCalendarClient = (accessToken: string, refreshToken?: string) => {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    return google.calendar({ version: 'v3', auth });
};

export interface GoogleEventData {
    title: string;
    description: string;
    startTime?: Date;
    endTime?: Date;
}

export const createGoogleEvent = async (
    accessToken: string,
    eventData: GoogleEventData,
    refreshToken?: string
) => {
    const calendar = getGoogleCalendarClient(accessToken, refreshToken);

    const now = new Date();
    const startTime = eventData.startTime || now;
    const endTime = eventData.endTime || new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

    const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Jakarta',
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Jakarta',
        },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
    });

    return response.data;
};