/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import axios from 'axios'
import {
  Tabs,
  Tab,
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

interface Location {
  id: number
  deviceId: string
  latitude: number
  longitude: number
  reverseData: string
  eventType: string
  timeLineId: string
  createdAt: string
  updatedAt: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role='tabpanel'
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    aria-labelledby={`simple-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)

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

const DetailPage: React.FC<{ timelineId: string }> = ({ timelineId }) => {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState<number>(0)

  const DynamicMap = dynamic(() => import('../../../components/DynamicMap'), {
    ssr: false,
    loading: () => (
      <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
        <CircularProgress />
      </Box>
    )
  })

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`/apis/timeline/detail?timelineId=${timelineId}`)

        if (response.data.success) {
          setLocations(response.data.data)
        } else {
          setError('Failed to fetch data')
        }
      } catch (err) {
        setError('Error fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [timelineId])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const formatAddress = (reverseData: string) => {
    try {
      const address = JSON.parse(reverseData)

      return `${address.village || address.municipality || address.county}, ${
        address.municipality || address.county || address.state
      }`
    } catch (error) {
      console.error('Error parsing address:', error)

      return 'Unknown Address'
    }
  }

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
      <Tabs value={tabValue} onChange={handleTabChange} aria-label='Tabs for table and map'>
        <Tab label='Table' />
        <Tab label='Map' />
      </Tabs>
      <TabPanel value={tabValue} index={0}>
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
              {locations.map(location => (
                <TableRow key={location.id}>
                  <TableCell>{location.latitude}</TableCell>
                  <TableCell>{location.longitude}</TableCell>
                  <TableCell>{location.eventType}</TableCell>
                  <TableCell>{formatAddress(location.reverseData)}</TableCell>
                  <TableCell>{formatDate(location.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ height: '500px', width: '100%' }}>
          <DynamicMap locations={locations} />
        </Box>
      </TabPanel>
    </Box>
  )
}

export default DetailPage
