/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'your-s3-bucket-name.s3.amazonaws.com', // Replace with your actual S3 bucket domain
      'images.printify.com',
      'images-api.printify.com'
    ],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5002/api',
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY
  }
}

module.exports = nextConfig
