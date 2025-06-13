'use client'

import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

import { useWebSocket } from '@/context/WebSocketContextRealtimeMonitor'

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

  const { socket } = useWebSocket() // Ambil socket dari WebSocket context
  const router = useRouter()

  useEffect(() => {
    const hasReloaded = localStorage.getItem('hasReloaded')

    if (hasReloaded === 'false') {
      localStorage.setItem('hasReloaded', 'true')
      window.location.reload()

      return
    }

    if (!socket) {
      console.log('Socket belum siap.')

      return
    }

    console.log('Socket siap, membuka koneksi WebSocket...')

    const fetchData = () => {
      console.log('Mengirim request activeTimeline...')

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ event: 'activeTimeline' })) // Kirim event ke server
      } else {
        console.error('Socket belum terbuka.')
      }
    }

    // WebSocket Connected
    socket.onopen = () => {
      console.log('WebSocket connected')
      fetchData()
    }

    // Handle WebSocket Messages
    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        if (data.event === 'activeTimeline') {
          if (!data.data || data.data.length === 0) {
            setError('Tidak ada device aktif.')
            setTimelines([])
          } else {
            setError(null)
            setTimelines(data.data)
          }

          setLoading(false)
        }
      } catch (err) {
        console.error('Gagal memproses pesan WebSocket:', err)
        setError('Data tidak valid dari server.')
        setLoading(false)
      }
    }

    // Handle WebSocket Error
    socket.onerror = error => {
      console.error('Kesalahan WebSocket:', error)
      setError('Gagal terhubung ke server.')
      setLoading(false)
    }

    // Cleanup
    return () => {
      console.log('Membersihkan listener WebSocket...')
      socket.onmessage = null
      socket.onerror = null
    }
  }, [socket])

  // Fallback saat loading
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Menampilkan error
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
        <Alert severity='warning'>{error}</Alert>
      </Box>
    )
  }

  // Menampilkan tabel jika ada data
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
              <TableRow
                key={timeline.id}
                hover
                onClick={() => {
                  localStorage.setItem('hasReloadedDetail', 'false')
                  router.push(`/realtime-monitor/${timeline.id}`)
                }}
                style={{ cursor: 'pointer' }}
              >
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
