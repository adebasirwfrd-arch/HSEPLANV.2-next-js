import { createRouteHandler } from "uploadthing/next"
import { ourFileRouter } from "./core"

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
    config: {
        // Token is read from UPLOADTHING_TOKEN env var automatically
    },
})
