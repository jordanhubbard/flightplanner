import React, { useMemo } from 'react'
import { Box } from '@mui/material'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { FlightPlan } from '../types'

type Props = {
  plan: FlightPlan
}

const FitBounds: React.FC<{ points: Array<[number, number]> }> = ({ points }) => {
  const map = useMap()

  React.useEffect(() => {
    if (points.length < 2) return
    const bounds = L.latLngBounds(points.map(([lat, lon]) => [lat, lon]))
    map.fitBounds(bounds.pad(0.25), { animate: true })
  }, [map, points])

  return null
}

const RouteMap: React.FC<Props> = ({ plan }) => {
  const points = useMemo(() => {
    if (!plan.segments || plan.segments.length === 0) {
      return [plan.origin_coords, plan.destination_coords]
    }

    const pts: Array<[number, number]> = [plan.segments[0].start]
    for (const seg of plan.segments) pts.push(seg.end)
    return pts
  }, [plan])

  const center = points[0] || plan.origin_coords

  return (
    <Box
      sx={{
        height: 400,
        borderRadius: 1,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <MapContainer
        center={[center[0], center[1]]}
        zoom={8}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={points} />

        <Polyline positions={points.map(([lat, lon]) => [lat, lon])} color="#1976d2" weight={4} />

        <CircleMarker center={[plan.origin_coords[0], plan.origin_coords[1]]} radius={8} pathOptions={{ color: 'green' }}>
          <Popup>Origin</Popup>
        </CircleMarker>

        <CircleMarker
          center={[plan.destination_coords[0], plan.destination_coords[1]]}
          radius={8}
          pathOptions={{ color: 'red' }}
        >
          <Popup>Destination</Popup>
        </CircleMarker>
      </MapContainer>
    </Box>
  )
}

export default React.memo(RouteMap)
