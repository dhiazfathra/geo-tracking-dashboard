'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

// WebSocket Context
const WebSocketContext = createContext<{
  socket: WebSocket | null
  data: any // Store received data
}>({
  socket: null,
  data: null
})

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [data, setData] = useState<any>(null) // State for received WebSocket data
  const reconnectTimeout = useRef<number | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      // Get WebSocket URL from environment variables or use default
      const baseUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001'

      // Convert http/https URLs to ws/wss
      const serverUrl = baseUrl.replace(/^http/, 'ws')
      const ws = new WebSocket(serverUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        ws.send(JSON.stringify({ event: 'activeTimeline' }))
        setSocket(ws)
      }

      ws.onmessage = event => {
        try {
          const receivedData = JSON.parse(event.data)

          console.log('Data received from WebSocket:', receivedData)

          // Update state with received data
          setData(receivedData)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
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

  return <WebSocketContext.Provider value={{ socket, data }}>{children}</WebSocketContext.Provider>
}

export const useWebSocket = () => useContext(WebSocketContext)
