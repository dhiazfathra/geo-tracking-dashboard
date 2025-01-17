'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

const WebSocketContext = createContext<WebSocket | null>(null)

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const reconnectTimeout = useRef<number | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      // const ws = new WebSocket('ws://103.153.60.118:3002')

      const ws = new WebSocket('ws://geo-tracking-dashboard.vercel.app/ws')

      ws.onopen = () => {
        console.log('WebSocket connected, from context')
        ws.send(JSON.stringify({ event: 'realtimeMonitor' }))
        setSocket(ws)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected, retrying...')
        reconnectTimeout.current = window.setTimeout(connectWebSocket, 5000)
      }

      ws.onerror = error => {
        console.error('WebSocket error:', error)
        ws.close()
      }

      return ws
    }

    const ws = connectWebSocket()

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }

      ws.close()
    }
  }, [])

  return <WebSocketContext.Provider value={socket}>{children}</WebSocketContext.Provider>
}

export const useWebSocket = () => useContext(WebSocketContext)
