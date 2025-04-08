/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  server: {
    port: process.env.PORT || 3000,
  },
}

module.exports = nextConfig 