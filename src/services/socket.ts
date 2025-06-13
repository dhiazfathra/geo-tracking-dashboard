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

// Define event map for type safety
interface SocketEventMap {
  pointers: Pointer[]
  pointerAdded: Pointer
  pointerRemoved: { id: string }
  pointerMoved: Pointer
  connected: { timestamp: string; message: string }
}

// Type for event listeners with specific event types
type EventListeners = {
  [K in keyof SocketEventMap]?: Array<(data: SocketEventMap[K]) => void>
}

// Type for connection event listeners
type ConnectionListeners = {
  close: Array<() => void>
}

// Define WebSocket message format
interface WebSocketMessage {
  event: string
  data?: any
}

class SocketService {
  private socket: WebSocket | null = null
  private listeners: EventListeners = {}
  private connectionListeners: ConnectionListeners = {
    close: []
  }
  private serverUrl: string
  private reconnectInterval: number = 5000
  private reconnectTimeout: number | null = null
  private isConnecting: boolean = false
  private _pendingMoves: Map<string, Pointer> | null = null
  private _animFrameId: number | null = null

  constructor() {
    // Get WebSocket URL from environment variables or use default
    const baseUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001'

    // Convert http/https URLs to ws/wss
    this.serverUrl = baseUrl.replace(/^http/, 'ws')
    console.log(`Socket service initialized with URL: ${this.serverUrl}`)
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log(`WebSocket already connected or connecting to ${this.serverUrl}`)

      return
    }

    if (this.isConnecting) {
      return
    }

    this.isConnecting = true
    console.log(`Connecting to WebSocket server at ${this.serverUrl}`)

    try {
      // Close any existing socket before creating a new one
      if (this.socket) {
        this.socket.close()
        this.socket = null
      }

      this.socket = new WebSocket(this.serverUrl)

      this.socket.onopen = this.handleOpen.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)
      this.socket.onclose = this.handleClose.bind(this)
      this.socket.onerror = this.handleError.bind(this)
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  private handleOpen() {
    console.log('Connected to WebSocket server')
    this.isConnecting = false

    // Request initial data
    this.getPointers()
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)

      // Only log important events or when debugging
      if (message.event !== 'pointerMoved') {
        console.log(`Received ${message.event} event:`, message.data)
      }

      // Handle different event types
      switch (message.event) {
        case 'pointers':
          this.emit('pointers', message.data)
          break
        case 'pointerAdded':
          this.emit('pointerAdded', message.data)
          break
        case 'pointerRemoved':
          this.emit('pointerRemoved', message.data)
          break
        case 'pointerMoved':
          // Throttle pointer moved events to avoid excessive re-renders
          // We'll use requestAnimationFrame to batch updates
          if (!this._pendingMoves) this._pendingMoves = new Map()

          // Store the latest position for this pointer
          this._pendingMoves.set(message.data.id, message.data)

          // If we don't have a frame request pending, create one
          if (!this._animFrameId) {
            this._animFrameId = requestAnimationFrame(() => {
              // Process all pending moves
              if (this._pendingMoves) {
                this._pendingMoves.forEach(pointer => {
                  this.emit('pointerMoved', pointer)
                })
                this._pendingMoves.clear()
              }

              this._animFrameId = null
            })
          }

          break
        case 'connected':
          this.emit('connected', message.data)
          break
        default:
          console.log('Unknown event type:', message.event)
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent) {
    console.log(`WebSocket disconnected with code ${event.code}, reason: ${event.reason}`)
    this.isConnecting = false
    this.socket = null
    this.connectionListeners.close.forEach(listener => {
      try {
        listener()
      } catch (error) {
        console.error('Error in close listener:', error)
      }
    })
    this.scheduleReconnect()
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error)
    this.isConnecting = false

    // The socket will automatically try to reconnect by triggering the onclose event
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = window.setTimeout(() => {
      console.log('Attempting to reconnect...')
      this.connect()
    }, this.reconnectInterval) as unknown as number
  }

  private sendMessage(message: WebSocketMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected, attempting to connect...')
      this.connect()

      return false
    }

    try {
      this.socket.send(JSON.stringify(message))

      return true
    } catch (error) {
      console.error('Error sending WebSocket message:', error)

      return false
    }
  }

  disconnect() {
    if (!this.socket) return

    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close(1000, 'Client disconnected')
    }

    this.socket = null
  }

  // Get all pointers
  getPointers() {
    return this.sendMessage({ event: 'getPointers' })
  }

  // Add a pointer
  addPointer(latitude: number, longitude: number) {
    return this.sendMessage({
      event: 'addPointer',
      data: { latitude, longitude }
    })
  }

  // Remove a pointer
  removePointer(id: string) {
    return this.sendMessage({
      event: 'removePointer',
      data: { id }
    })
  }

  // Move a pointer
  movePointer(id: string, latitude: number, longitude: number) {
    return this.sendMessage({
      event: 'movePointer',
      data: { id, latitude, longitude }
    })
  }

  // Type-safe event emitter/listener pattern for components
  on<K extends keyof SocketEventMap>(event: K, callback: (data: SocketEventMap[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }

    // Type assertion needed due to the complexity of the event system
    this.listeners[event]?.push(callback as (data: SocketEventMap[K]) => void)
  }

  off<K extends keyof SocketEventMap>(event: K, listener: (data: SocketEventMap[K]) => void) {
    if (this.listeners[event]) {
      // Use type assertion to handle the complex event system
      const filtered = this.listeners[event]?.filter(l => l !== listener)

      if (filtered) {
        this.listeners[event] = filtered as any
      }
    }
  }

  // Connection event handlers
  onClose(listener: () => void) {
    this.connectionListeners.close.push(listener)
  }

  offClose(listener: () => void) {
    this.connectionListeners.close = this.connectionListeners.close.filter(l => l !== listener)
  }

  private emit<K extends keyof SocketEventMap>(event: K, data: SocketEventMap[K]): void {
    const callbacks = this.listeners[event]

    if (!callbacks) return

    callbacks.forEach(callback => {
      callback(data)
    })
  }
}

// Create a singleton instance
const socketService = new SocketService()

export default socketService
