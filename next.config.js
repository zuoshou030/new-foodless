/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router在Next.js 14中已经稳定，不再需要experimental配置
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      // 如果需要代理到原有API，可以在这里配置
      // {
      //   source: '/api/:path*',
      //   destination: 'http://localhost:3000/api/:path*'
      // }
    ]
  }
}

module.exports = nextConfig 