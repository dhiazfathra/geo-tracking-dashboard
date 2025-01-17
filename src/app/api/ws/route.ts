import type { IncomingMessage, ServerResponse } from 'http'

import { createProxyMiddleware } from 'http-proxy-middleware'

export const config = {
  api: {
    bodyParser: false // Disables body parsing for WebSocket proxying
  }
}

const wsProxy = createProxyMiddleware({
  target: 'ws://103.153.60.118:3002', // Backend WebSocket server
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  pathRewrite: {
    '^/api/ws': '/' // Rewrite the path if necessary
  }
})

export default function handler(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
  return wsProxy(req, res)
}
