import React, { useMemo } from 'react'
import { Box } from '@mui/material'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { FlightPlan } from '../types'
import type { WeatherOverlayKey, WeatherOverlays } from './WeatherOverlayControls'

type Props = {
  plan: FlightPlan
  overlays?: WeatherOverlays
}

const OPENWEATHER_LAYERS: Record<WeatherOverlayKey, string> = {
  clouds: 'clouds_new',
  wind: 'wind_new',
  precipitation: 'precipitation_new',
  temperature: 'temp_new',
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

const RouteMap: React.FC<Props> = ({ plan, overlays }) => {
  const points = useMemo(() => {
    if (!plan.segments || plan.segments.length === 0) {
      return [plan.origin_coords, plan.destination_coords]
    }

    const pts: Array<[number, number]> = [plan.segments[0].start]
    for (const seg of plan.segments) pts.push(seg.end)
    return pts
  }, [plan])

  const center = points[0] || plan.origin_coords
  const owmKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY

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

        {owmKey &&
          overlays &&
          (Object.keys(overlays) as WeatherOverlayKey[]).map((key) => {
            if (!overlays[key].enabled) return null
            const layer = OPENWEATHER_LAYERS[key]
            return (
              <TileLayer
                key={key}
                url={`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${owmKey}`}
                opacity={overlays[key].opacity}
              />
            )
          })}

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
