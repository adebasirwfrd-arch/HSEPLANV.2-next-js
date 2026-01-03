import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

// File router for UploadThing
export const ourFileRouter = {
    // Safety Moment Images
    safetyMomentImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
        .middleware(async () => {
            // Anyone can upload for now - add auth check if needed
            return { userId: "anonymous" }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId)
            console.log("File URL:", file.ufsUrl)
            return { url: file.ufsUrl }
        }),

    // Safety Moment Videos
    safetyMomentVideo: f({ video: { maxFileSize: "64MB", maxFileCount: 1 } })
        .middleware(async () => {
            return { userId: "anonymous" }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Video upload complete:", file.ufsUrl)
            return { url: file.ufsUrl }
        }),

    // General media (image or video)
    safetyMomentMedia: f({
        image: { maxFileSize: "8MB", maxFileCount: 4 },
        video: { maxFileSize: "64MB", maxFileCount: 1 },
    })
        .middleware(async () => {
            return { userId: "anonymous" }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Media upload complete:", file.ufsUrl)
            return { url: file.ufsUrl, type: file.type.startsWith("video/") ? "video" : "image" }
        }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
