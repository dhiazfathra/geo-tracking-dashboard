'use client'

import { useEffect, useState } from 'react'

import { Box, Button, Typography } from '@mui/material'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'

import type { Pointer } from '@/services/socket'
import socketService from '@/services/socket'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet with Next.js
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to handle map clicks
function MapEvents() {
  const _map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng

      socketService.addPointer(lat, lng)
    }
  })

  return null
}

interface MultiPointerMapProps {
  pointers: Pointer[]
  onRemovePointer: (id: string) => void
}

const MultiPointerMap = ({ pointers, onRemovePointer }: MultiPointerMapProps) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0])

  useEffect(() => {
    // Set initial map center based on first pointer or default to Jakarta
    if (pointers.length > 0) {
      setMapCenter([pointers[0].latitude, pointers[0].longitude])
    } else {
      // Default to Jakarta coordinates
      setMapCenter([-6.2088, 106.8456])
    }
  }, [pointers])

  // Handle random movement of a pointer (for demo purposes)
  const handleMovePointer = (pointer: Pointer) => {
    const newLat = pointer.latitude + (Math.random() - 0.5) * 0.01
    const newLng = pointer.longitude + (Math.random() - 0.5) * 0.01

    socketService.movePointer(pointer.id, newLat, newLng)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)


      return date.toLocaleString()
    } catch (e) {
      return timestamp
    }
  }

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {mapCenter[0] !== 0 && (
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {pointers.map((pointer) => (
            <Marker
              key={pointer.id}
              position={[pointer.latitude, pointer.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <Box sx={{ minWidth: '200px' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {pointer.deviceName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pointer.os}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Device ID: {pointer.deviceId.substring(0, 8)}...
                  </Typography>
                  <Typography variant="body2">
                    Lat: {pointer.latitude.toFixed(6)}
                  </Typography>
                  <Typography variant="body2">
                    Lng: {pointer.longitude.toFixed(6)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Updated: {formatTimestamp(pointer.timestamp)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleMovePointer(pointer)}
                    >
                      Move
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => onRemovePointer(pointer.id)}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              </Popup>
            </Marker>
          ))}

          <MapEvents />
        </MapContainer>
      )}
    </Box>
  )
}

export default MultiPointerMap
