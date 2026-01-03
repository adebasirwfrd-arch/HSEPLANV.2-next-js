/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig: any = {
  // Security: Hide Next.js header
  poweredByHeader: false,

  // Empty turbopack config to acknowledge we know we have webpack config
  turbopack: {},

  // Build optimization: Ignore TS/ESLint errors for smoother deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Server actions config
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Enable image optimization for Stream.io CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all valid HTTPS domains for now to prevent broken user content
      },
    ],
  },

  // FIX: Exclude @react-pdf/renderer from server bundling (Turbopack compatibility)
  serverExternalPackages: ['@react-pdf/renderer'],

  // Webpack configuration for @react-pdf/renderer (used in production builds)
  webpack: (config: any) => {
    config.resolve.alias.canvas = false;
    return config;
  }
};

const configWithPWA = withPWA(nextConfig);

// Injected content via Sentry Wizard
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withSentryConfig } = require("@sentry/nextjs");

export default withSentryConfig(
  configWithPWA,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "hse-plan",
    project: "nextjs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
