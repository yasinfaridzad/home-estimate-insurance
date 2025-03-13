/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable hot reloading
  webpack: (config, { dev, isServer }) => {
    // Enable fast refresh
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // Increase the timeout for development server
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 