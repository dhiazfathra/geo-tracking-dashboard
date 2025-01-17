'use client'

import React from 'react'

import type { LatLngTuple } from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons not being displayed
delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

interface Location {
  latitude: number
  longitude: number
  eventType: string
  reverseData: string
}

interface DynamicMapProps {
  locations: Location[]
}

const formatAddress = (reverseData: string): string => {
  try {
    const address = JSON.parse(reverseData)
    const village = address.village || ''
    const municipality = address.municipality || ''
    const county = address.county || ''
    const state = address.state || ''
    const country = address.country || ''

    // Build a readable address
    return `${village}, ${municipality}, ${county}, ${state}, ${country}`.replace(/(^,|,$)/g, '')
  } catch (error) {
    console.error('Error parsing address:', error)

    return 'Unknown Address'
  }
}

const DynamicMap: React.FC<DynamicMapProps> = ({ locations }) => {
  // Default center (if no locations available)
  const center: LatLngTuple = [locations[0]?.latitude || 0, locations[0]?.longitude || 0]

  // Create an array of LatLng tuples for the polyline
  const polylinePositions: LatLngTuple[] = locations.map(location => [location.latitude, location.longitude])

  return (
    <MapContainer center={center} zoom={20} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {locations.map((location, index) => (
        <Marker key={index} position={[location.latitude, location.longitude]}>
          <Popup>
            <strong>Event Type:</strong> {location.eventType}
            <br />
            <strong>Address:</strong> {formatAddress(location.reverseData)}
          </Popup>
        </Marker>
      ))}
      {polylinePositions.length > 1 && <Polyline positions={polylinePositions} color='blue' weight={4} opacity={0.8} />}
    </MapContainer>
  )
}

export default DynamicMap
