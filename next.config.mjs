/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
        locale: false
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/apis/:path*',
        destination: `${process.env.API_URL}/:path*`
      }
    ]
  }
}

export default nextConfig
