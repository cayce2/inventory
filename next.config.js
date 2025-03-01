/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['soys.co.ke'], // Simpler alternative if you don't need specific protocol/pathname rules
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'soys.co.ke',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: '0oflunqznwz0bbpp.public.blob.vercel-storage.com',
          port: '',
          pathname: '/**',
        },
      ],
      // Add performance optimizations
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      formats: ['image/webp'],
      minimumCacheTTL: 60,
    },
    // Add additional performance optimizations
    swcMinify: true,
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
  }
  
  module.exports = nextConfig
  