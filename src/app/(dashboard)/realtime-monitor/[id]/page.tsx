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

interface TimelineDetail {
  locations: Location[]
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

    return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString))
  }

  useEffect(() => {
    if (!socket || !timelineId) {
      console.log('Socket atau timelineId tidak tersedia.')
      setError('ID Tidak valid.')

      return
    }

    // Kirim request detailActivity ke server
    // socket.send(JSON.stringify({ event: 'detailActivity', timelineId }))

    socket.send(JSON.stringify({ event: 'detailActivity', data: { timelineId } }))

    socket.onmessage = event => {
      try {
        const response = JSON.parse(event.data)

        console.log(response.event, 'eventnya')

        if (response.event === 'detailActivity') {
          if (response.datas && response.datas.length > 0) {
            setTimeline({ locations: response.datas })
            setError(null)
          } else {
            setError('Tidak ada detail timeline ditemukan.')
            setTimeline(null)
          }

          setLoading(false)
        }
      } catch (err) {
        console.error('Kesalahan parsing pesan:', err)
        setError('Terjadi kesalahan memproses data dari server.')
        setLoading(false)
      }
    }

    socket.onerror = error => {
      console.error('Kesalahan WebSocket:', error)
      setError('Gagal terhubung ke server.')
      setLoading(false)
    }

    return () => {
      console.log('Membersihkan listener WebSocket...')
      socket.onmessage = null
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

  if (!timeline || timeline.locations.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
        <Alert severity='info'>Tidak ada detail timeline ditemukan.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ padding: '20px' }}>
      <h2>Detail Timeline</h2>
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
            {timeline.locations.map(location => (
              <TableRow key={location.id}>
                <TableCell>{location.latitude}</TableCell>
                <TableCell>{location.longitude}</TableCell>
                <TableCell>{location.eventType}</TableCell>
                <TableCell>{JSON.parse(location.reverseData)?.village || 'Unknown Address'}</TableCell>
                <TableCell>{formatDate(location.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ height: '500px', width: '100%', marginTop: '20px' }}>
        <DynamicMap locations={timeline.locations} />
      </Box>
    </Box>
  )
}

export default TimelineDetailPage
