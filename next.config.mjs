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
      },
      {
        source: '/ws',
        destination: 'ws://103.153.60.118:3002'
      }
    ]
  }
}

export default nextConfig
