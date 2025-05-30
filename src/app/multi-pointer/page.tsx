'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import { Avatar, Box, Button, Card, CardContent, CardHeader, Chip, Typography } from '@mui/material';

import type { Pointer } from '@/services/socket';
import socketService from '@/services/socket';

// Dynamically import the map component to avoid SSR issues with Leaflet
const MultiPointerMap = dynamic(() => import('@/components/multi-pointer/MultiPointerMap'), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Typography>Loading map...</Typography>
    </Box>
  )
})

const MultiPointerPage = () => {
  const [pointers, setPointers] = useState<Pointer[]>([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [updateCount, setUpdateCount] = useState<number>(0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  // Use refs to avoid unnecessary re-renders
  const pointersRef = useRef<Pointer[]>([])
  const updateCountRef = useRef<number>(0)

  // Define a memoized function to handle reconnection
  const handleReconnect = useCallback(() => {
    console.log('MultiPointerPage: Reconnecting...')
    setConnectionStatus('connecting')
    socketService.connect()
    socketService.getPointers()
  }, [])

  useEffect(() => {
    console.log('MultiPointerPage: useEffect running')

    // Connect to the WebSocket server
    console.log('MultiPointerPage: Calling socketService.connect()')
    setConnectionStatus('connecting')
    socketService.connect()

    // Get initial pointers
    console.log('MultiPointerPage: Calling socketService.getPointers()')
    socketService.getPointers()

    // Set up event listeners with performance optimizations
    const handlePointers = (data: Pointer[]) => {
      // Update both state and ref
      setPointers(data)
      pointersRef.current = data
      setLastUpdate(new Date().toLocaleTimeString())
      console.log('MultiPointerPage: handlePointers running ', data)
    }

    const handlePointerAdded = (pointer: Pointer) => {
      // Update both state and ref
      const newPointers = [...pointersRef.current, pointer]
      setPointers(newPointers)
      pointersRef.current = newPointers
      setLastUpdate(new Date().toLocaleTimeString())
      console.log('MultiPointerPage: handlePointerAdded running ', pointer)
    }

    const handlePointerRemoved = (data: { id: string }) => {
      // Update both state and ref
      const newPointers = pointersRef.current.filter(p => p.id !== data.id)
      setPointers(newPointers)
      pointersRef.current = newPointers
      setLastUpdate(new Date().toLocaleTimeString())
      console.log('MultiPointerPage: handlePointerRemoved running ', data)
    }

    const handlePointerMoved = (pointer: Pointer) => {
      // Batch updates using refs and requestAnimationFrame
      updateCountRef.current++

      // Update the ref immediately
      pointersRef.current = pointersRef.current.map((p: Pointer) =>
        p.id === pointer.id ? pointer : p
      )

      // Throttle state updates to once per animation frame
      if (updateCountRef.current === 1) {
        requestAnimationFrame(() => {
          setPointers([...pointersRef.current])
          setLastUpdate(new Date().toLocaleTimeString())
          updateCountRef.current = 0
        })
      }
    }

    const handleConnected = () => {
      setConnected(true)
      setConnectionStatus('connected')
    }

    // Handle disconnection
    const handleDisconnected = () => {
      setConnected(false)
      setConnectionStatus('disconnected')
    }

    socketService.on('pointers', handlePointers)
    socketService.on('pointerAdded', handlePointerAdded)
    socketService.on('pointerRemoved', handlePointerRemoved)
    socketService.on('pointerMoved', handlePointerMoved)
    socketService.on('connected', handleConnected)

    // Listen for disconnection events
    const handleSocketClose = () => {
      console.log('WebSocket connection closed')
      setConnectionStatus('disconnected')

      // Attempt to reconnect after a delay
      setTimeout(() => {
        handleReconnect()
      }, 3000)
    }

    socketService.onClose(handleSocketClose)

    // Clean up on unmount
    return () => {
      socketService.off('pointers', handlePointers)
      socketService.off('pointerAdded', handlePointerAdded)
      socketService.off('pointerRemoved', handlePointerRemoved)
      socketService.off('pointerMoved', handlePointerMoved)
      socketService.off('connected', handleConnected)
      socketService.offClose(handleSocketClose)
      socketService.disconnect()
    }
  }, [handleReconnect])

  return (
    <Box sx={{ p: 5 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Multi-Pointer Tracking</Typography>

      {/* Connection status indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <Chip
          label={connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          color={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'error'}
          variant="outlined"
        />
        {lastUpdate && (
          <Typography variant="body2" color="text.secondary">
            Last update: {lastUpdate}
          </Typography>
        )}
        {connectionStatus === 'disconnected' && (
          <Button
            variant="contained"
            size="small"
            onClick={handleReconnect}
          >
            Reconnect
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Active Devices"
          subheader={`${pointers.length} device${pointers.length !== 1 ? 's' : ''} currently tracked`}
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {pointers.length > 0 ? (
              pointers.map(pointer => (
                <Chip
                  key={pointer.id}
                  avatar={<Avatar>{pointer.deviceName.charAt(0).toUpperCase()}</Avatar>}
                  label={`${pointer.deviceName} (${pointer.os})`}
                  variant="outlined"
                  color="primary"
                  onDelete={() => socketService.removePointer(pointer.id)}
                />
              ))
            ) : (
              <Typography color="text.secondary">No active devices</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Live Map" />
        <CardContent>
          <Box sx={{ height: '500px', width: '100%' }}>
            <MultiPointerMap
              pointers={pointers}
              onRemovePointer={(id) => socketService.removePointer(id)}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default MultiPointerPage
