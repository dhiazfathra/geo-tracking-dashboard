'use client'

import React, { useEffect, useState } from 'react'

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material'

import { useWebSocket } from '@/context/WebSocketContext'

interface Device {
  id: string
  name: string
  os: string
}

interface Timeline {
  id: string
  deviceId: string
  startTime: string
  endTime: string | null
  Device: Device
  locations?: any
}

const RealtimeMonitor: React.FC = () => {
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const socket = useWebSocket()

  useEffect(() => {
    console.log('Socket in page:', socket) // Harus menampilkan WebSocket instance

    if (!socket) return

    // WebSocket Connected
    socket.onopen = () => {
      console.log('WebSocket connected, from page')

      // Minta data awal (realtimeMonitor)
      socket.send(JSON.stringify({ event: 'realtimeMonitor', payload: {} }))
    }

    // Handle WebSocket Messages
    socket.onmessage = event => {
      console.log('WebSocket message received:', event.data)

      const data = JSON.parse(event.data)

      console.log('Received WebSocket event:', data)

      switch (data.event) {
        case 'realtimeMonitor':
          if (data.payload.length === 0) {
            setError('Tidak ada timeline aktif.')
            setTimelines([])
          } else {
            setError(null)
            setTimelines(data.payload)
          }

          setLoading(false)
          break

        case 'locationUpdate':
          // Perbarui lokasi jika ada update
          setTimelines(prevTimelines => {
            const updatedTimelines = [...prevTimelines]

            const timelineIndex = updatedTimelines.findIndex(timeline => timeline.deviceId === data.payload.deviceId)

            if (timelineIndex !== -1) {
              updatedTimelines[timelineIndex] = {
                ...updatedTimelines[timelineIndex],
                locations: [
                  ...(updatedTimelines[timelineIndex].locations || []),
                  {
                    latitude: data.payload.latitude,
                    longitude: data.payload.longitude,
                    reverseData: data.payload.reverseData
                  }
                ]
              }
            }

            return updatedTimelines
          })
          break

        default:
          console.warn('Unhandled WebSocket event:', data.event)
          break
      }
    }

    // Handle WebSocket Error
    socket.onerror = error => {
      console.error('WebSocket error:', error)
      setError('Gagal terhubung ke server.')
      setLoading(false)
    }

    // Cleanup
    return () => {
      socket.onmessage = null
      socket.onerror = null
    }
  }, [socket])

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
        <Alert severity='warning'>{error}</Alert>
      </Box>
    )
  }

  if (timelines.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
        <Alert severity='info'>Tidak ada timeline aktif.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ padding: '20px' }}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Device Name</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timelines.map(timeline => (
              <TableRow key={timeline.id}>
                <TableCell>{timeline.Device.name}</TableCell>
                <TableCell>{new Date(timeline.startTime).toLocaleString()}</TableCell>
                <TableCell>{timeline.endTime ? new Date(timeline.endTime).toLocaleString() : 'Ongoing'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default RealtimeMonitor
