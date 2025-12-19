/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'pdqhsxnkxltvfrcdzphg.supabase.co',
      'images.printify.com',
      'images-api.printify.com'
    ],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000/api',
    STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  }
}

module.exports = nextConfig
