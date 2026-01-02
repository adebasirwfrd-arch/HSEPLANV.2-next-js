import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to acknowledge we know we have webpack config
  turbopack: {},

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
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
};

export default nextConfig;
