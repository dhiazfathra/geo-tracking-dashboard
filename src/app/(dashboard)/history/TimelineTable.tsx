import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import axios from 'axios'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material'

interface Device {
  id: string
  name: string
  os: string
  createdAt: string
  updatedAt: string
}

interface Timeline {
  id: string
  deviceId: string
  startTime: string
  endTime: string | null
  createdAt: string
  updatedAt: string
  Device: Device
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Use 24-hour format
  }

  const date = new Date(dateString)

  return new Intl.DateTimeFormat('en-US', options).format(date)
}

const TimelineTable: React.FC = () => {
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTimelines = async () => {
      try {
        const response = await axios.get('/apis/timeline') // Use the rewritten endpoint

        if (response.data.success) {
          setTimelines(response.data.data)
        } else {
          setError('Failed to fetch data')
        }
      } catch (err) {
        setError('Error fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchTimelines()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <CircularProgress />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Alert severity='error'>{error}</Alert>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <TableContainer>
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
                onClick={() => router.push(`/history/${timeline.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>{timeline.Device.name || 'Unknown'}</TableCell>
                <TableCell>{formatDate(timeline.startTime)}</TableCell>

                <TableCell>{timeline.endTime ? formatDate(timeline.endTime) : 'Ongoing'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}

export default TimelineTable
