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

  // FIX: Exclude @react-pdf/renderer from server bundling (Turbopack compatibility)
  serverExternalPackages: ['@react-pdf/renderer'],

  // Webpack configuration for @react-pdf/renderer (used in production builds)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
};

export default nextConfig;
