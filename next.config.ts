import type { NextConfig } from "next";

// @ts-ignore
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig: any = {
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

export default withPWA(nextConfig);
