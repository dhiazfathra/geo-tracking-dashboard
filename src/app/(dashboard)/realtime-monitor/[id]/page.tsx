'use client'

import React, { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import { useParams } from 'next/navigation'

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

interface Location {
  id: number
  latitude: number
  longitude: number
  reverseData: string
  eventType: string
  createdAt: string
}

interface Device {
  name: string
}

interface TimelineDetail {
  locations: Location[]
  device: Device
}

const DynamicMap = dynamic(() => import('../../../components/DynamicMap'), { ssr: false })

const TimelineDetailPage: React.FC = () => {
  const [timeline, setTimeline] = useState<TimelineDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const socket = useWebSocket()

  const timelineId = params?.id

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }

    const date = new Date(dateString)

    return new Intl.DateTimeFormat('en-US', options).format(date)
  }

  useEffect(() => {
    if (!socket || !timelineId) return

    socket.send(JSON.stringify({ event: 'timelineDetailRealtime', timelineId }))

    socket.onmessage = event => {
      const data = JSON.parse(event.data)

      if (data.event === 'timelineDetailRealtime') {
        if (data.payload.error) {
          setError(data.payload.error)
        } else {
          setTimeline(data.payload)
        }

        setLoading(false)
      }
    }

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ event: 'unsubscribe', type: 'timelineDetailRealtime', timelineId }))
      }
    }
  }, [socket, timelineId])

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
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ padding: '20px' }}>
      <h2>{timeline?.device.name}</h2>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Latitude</TableCell>
              <TableCell>Longitude</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeline?.locations.map(location => (
              <TableRow key={location.id}>
                <TableCell>{location.latitude}</TableCell>
                <TableCell>{location.longitude}</TableCell>
                <TableCell>{location.eventType}</TableCell>
                <TableCell>{JSON.parse(location.reverseData).village || 'Unknown Address'}</TableCell>
                <TableCell>{formatDate(location.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ height: '500px', width: '100%', marginTop: '20px' }}>
        <DynamicMap locations={timeline?.locations || []} />
      </Box>
    </Box>
  )
}

export default TimelineDetailPage
