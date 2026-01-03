# 🚀 Deployment Guide: HSE Management System (Next.js)

## Overview
This application is a specialized **HSE Management Dashboard** built with **Next.js 16**, designed to be deployed on **Vercel** with a **Supabase** backend.

### Tech Stack
- **Frontend**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS + Framer Motion
- **Backend / DB**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Services**:
  - **Stream.io**: Activity Feeds
  - **Google Cloud**: Calendar Sync
  - **UploadThing**: Media storage
  - **Vercel Cron**: Scheduled tasks

---

## ⚙️ Environment Variables
You need to set these variables in your Vercel project settings:

### **1. Supabase (Database & Auth)**
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon (public) Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role (secret) Key (for specialized admin tasks) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Email address of the super-admin user (e.g., `ade.basirwfrd@gmail.com`) |

### **2. Stream.io (Activity Feed)**
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STREAM_KEY` | Stream Public API Key |
| `STREAM_SECRET` | Stream Secret Key (Server-side only) |
| `NEXT_PUBLIC_STREAM_APP_ID` | Stream App ID |

### **3. Google Calendar Integration**
| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret |
| `GOOGLE_REFRESH_TOKEN` | Refresh token for offline access (generated via script) |
| `NEXT_PUBLIC_GOOGLE_CALENDAR_ID` | The ID of the Google Calendar to sync with (e.g., `primary`) |

### **4. UploadThing (Media)**
| Variable | Description |
|----------|-------------|
| `UPLOADTHING_TOKEN` | Token from UploadThing dashboard |

### **5. Application Settings**
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | The URL of your deployed app (e.g., `https://your-app.vercel.app`) |

---

## 🛠️ Step-by-Step Deployment

### **Step 1: Push to GitHub**
Ensure your local code is pushed to your GitHub repository:
```bash
git add .
git commit -m "Deployment Update"
git push origin main
```

### **Step 2: Deploy to Vercel**
1. Import your GitHub repository into your existing Vercel project (or create a new deployment from it).
2. Ensure all keys listed in the **Environment Variables** section are correctly set in the Vercel Project Settings.
3. Click **Deploy**.

### **Step 3: Configure Cron Jobs**
The project includes a `vercel.json` file that automatically sets up a Cron Job for reminders:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```
*This triggers the reminder check everyday at 8:00 AM UTC.*

---

## 🔍 Verification Checklist

After deployment is complete:
1. **Visit the URL**: Ensure the app loads and the "Ocean Trust" theme is visible.
2. **Login**: Test logging in with the Admin email.
3. **Database Check**: Create a dummy "Task" or "Post" and check if it appears in your Supabase table.
4. **Feeds**: Post a message in the "Community" feed to verify Stream.io connection.
5. **Mobile View**: Open on your phone to verify the responsive PWA layout.

---

## 🆘 Troubleshooting

- **Build Failures**: Check the Vercel logs. Common issues are missing environment variables or type errors.
  - *Note: Type errors are currently ignored in build config for smoother deployment.*
- **Database Connection Error**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.
- **Calendar Sync Failing**: Ensure your Google Refresh Token is valid and has `https://www.googleapis.com/auth/calendar` scope.

---

## 📱 Appendix A: Android Enterprise Build (APK)

> [!IMPORTANT]
> This build configuration complies with **Google Play Console requirements (API Level 35)** and **Enterprise Security Standards**.

### **1. Compliance & Security Standards (Mandatory)**
All builds must adhere to the following versioning and security rules to ensure Play Store compliance and data protection.

#### A. Version Standards (Google Play)
- **Expo SDK**: `52.0.36` (Exact match required for stability)
- **Android API Level**: `35` (Required for Android 15 support)
- **Kotlin Version**: `1.9.25` (Required by Gradle for API 35)
- **Expo Build Properties**: `~0.13.0`

#### B. Security Policies
- **Code Obfuscation**: `ProGuard/R8` must be enabled for all release builds to prevent reverse engineering.
- **Data Protection**: `allowBackup` must be set to `false` to prevent local data extraction via ADB.
- **JS Engine**: `Hermes` must be used to compile JavaScript to bytecode (improves startup time & security).

### **2. Configuration Implementation (app.json)**
Ensure your `app.json` includes these specific plugins to enforce the standards above.

```json
{
  "expo": {
    "name": "HSE Plan MS",
    "slug": "hse-plan",
    "version": "1.0.0",
    "jsEngine": "hermes",
    "android": {
      "package": "com.hseprowse.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "kotlinVersion": "1.9.25",
            "enableProguardInReleaseBuilds": true,
            "allowBackup": false,
            "extraProguardRules": "-keep class com.facebook.react.** { *; } -keep class com.facebook.flipper.** { *; } -keepattributes *Annotation*"
          }
        }
      ]
    ]
  }
}
```

### **3. Build Configuration (eas.json)**
Use the `production-apk` profile to trigger the ProGuard/R8 rules.

```json
{
  "build": {
    "production-apk": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "EXPO_NO_TELEMETRY": "1",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### **4. Execution Command**

```bash
# 1. Install specific dependencies for compliance
npm install expo@52.0.36 expo-build-properties@~0.13.0 expo-splash-screen@~0.29.0

# 2. Clear Cache & Build Secure APK
npx expo start -c
eas build --platform android --profile production-apk --local
```

### **5. 🔍 Verification & Troubleshooting**

| Check | Action | Pass | Fail |
| :--- | :--- | :--- | :--- |
| **Admin Access** | Log in as Admin -> Try to delete a post. | Action completes via `/api/admin`. | Check Vercel Logs for 401 Unauthorized or missing Service Key. |
| **Audit Logs** | Perform an action -> Check Recent Activity sidebar. | `actor_email` is correctly captured. | Ensure no redundant requests for `audit_logs` (Caching check). |
| **App Performance** | Check "Network" tab. | Images/videos are lazy-loaded. | |
