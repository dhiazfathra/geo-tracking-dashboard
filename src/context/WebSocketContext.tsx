'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

// Define pointer interface
export interface Pointer {
  id: string
  deviceId: string
  deviceName: string
  os: string
  latitude: number
  longitude: number
  timestamp: string
}

// Define event types for type safety
type WebSocketEvent = {
  event: string
  data: any
}

// WebSocket Context with typed data
const WebSocketContext = createContext<{
  socket: WebSocket | null
  pointers: Pointer[]
  connected: boolean
  connect: () => WebSocket
  getPointers: () => void
  addPointer: (latitude: number, longitude: number) => void
  removePointer: (id: string) => void
  movePointer: (id: string, latitude: number, longitude: number) => void
}>({
  socket: null,
  pointers: [],
  connected: false,
  connect: () => { throw new Error('Not implemented') },
  getPointers: () => {},
  addPointer: () => {},
  removePointer: () => {},
  movePointer: () => {}
})

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [pointers, setPointers] = useState<Pointer[]>([])
  const [connected, setConnected] = useState<boolean>(false)
  const reconnectTimeout = useRef<number | null>(null)

  // Get WebSocket URL from environment variables or use default
  const baseUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001'
  // Convert http/https URLs to ws/wss
  const serverUrl = baseUrl.replace(/^http/, 'ws')
  console.log(`WebSocketContext initialized with URL: ${serverUrl}`)

  const connectWebSocket = () => {
    console.log(`Connecting to WebSocket server at ${serverUrl}`)
    const ws = new WebSocket(serverUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setSocket(ws)
      setConnected(true)
      // Request initial pointers data
      ws.send(JSON.stringify({ event: 'getPointers' }))
    }

    ws.onmessage = event => {
      try {
        const message: WebSocketEvent = JSON.parse(event.data)
        console.log('Data received from WebSocket:', message)

        // Handle different event types
        switch (message.event) {
          case 'pointers':
            setPointers(message.data)
            break
          case 'pointerAdded':
            setPointers(prev => [...prev, message.data])
            break
          case 'pointerRemoved':
            setPointers(prev => prev.filter(p => p.id !== message.data.id))
            break
          case 'pointerMoved':
            setPointers(prev =>
              prev.map(p => (p.id === message.data.id ? { ...p, ...message.data } : p))
            )
            break
          case 'connected':
            console.log('Connection message:', message.data)
            break
          default:
            console.log('Unknown event type:', message.event)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected, retrying...')
      setConnected(false)
      reconnectTimeout.current = window.setTimeout(connectWebSocket, 5000)
    }

    ws.onerror = error => {
      console.error('WebSocket error:', error)
      setConnected(false)
      ws.close()
    }

    return ws
  }

  // Disable automatic connection to prevent conflicts with socketService
  // Only connect when explicitly requested
  const connect = () => {
    const ws = connectWebSocket()
    return ws
  }
  
  // Clean up function for when component unmounts
  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close()
      }
    }
  }, [])

  // WebSocket API methods
  const getPointers = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify({ event: 'getPointers' }))
  }

  const addPointer = (latitude: number, longitude: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify({ event: 'addPointer', data: { latitude, longitude } }))
  }

  const removePointer = (id: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify({ event: 'removePointer', data: { id } }))
  }

  const movePointer = (id: string, latitude: number, longitude: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify({ event: 'movePointer', data: { id, latitude, longitude } }))
  }

  return (
    <WebSocketContext.Provider 
      value={{ 
        socket, 
        pointers, 
        connected,
        connect,
        getPointers, 
        addPointer, 
        removePointer, 
        movePointer 
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)
