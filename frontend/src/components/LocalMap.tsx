import React, { useMemo } from 'react'
import { Box, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { getRuntimeEnv } from '../utils'
import type { LocalPlanResponse } from '../types'
import type { WeatherOverlayKey, WeatherOverlays } from './WeatherOverlayControls'

type Props = {
  plan: LocalPlanResponse
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

const nmToMeters = (nm: number) => nm * 1852

const LocalMap: React.FC<Props> = ({ plan, overlays }) => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const center = useMemo<[number, number]>(
    () => [plan.center.latitude, plan.center.longitude],
    [plan.center.latitude, plan.center.longitude],
  )

  const points = useMemo(() => {
    const pts: Array<[number, number]> = [center]
    for (const ap of plan.nearby_airports.slice(0, 60)) {
      pts.push([ap.latitude, ap.longitude])
    }
    return pts
  }, [center, plan.nearby_airports])

  const owmKey = getRuntimeEnv('VITE_OPENWEATHERMAP_API_KEY')

  return (
    <Box
      sx={{
        height: { xs: 300, sm: 400 },
        borderRadius: 1,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <MapContainer
        center={[center[0], center[1]]}
        zoom={9}
        scrollWheelZoom={!isSmall}
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

        <Circle
          center={[center[0], center[1]]}
          radius={nmToMeters(plan.radius_nm)}
          pathOptions={{ color: '#1976d2', weight: 2 }}
        />

        <CircleMarker center={[center[0], center[1]]} radius={9} pathOptions={{ color: 'green' }}>
          <Popup>
            {plan.center.icao || plan.center.iata} — {plan.center.name || plan.center.city}
          </Popup>
        </CircleMarker>

        {plan.nearby_airports.slice(0, 60).map((ap) => (
          <CircleMarker
            key={ap.icao || ap.iata}
            center={[ap.latitude, ap.longitude]}
            radius={5}
            pathOptions={{ color: '#6d6d6d' }}
          >
            <Popup>
              {ap.icao || ap.iata} — {ap.name || ap.city} ({ap.distance_nm.toFixed(1)} nm)
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Box>
  )
}

export default React.memo(LocalMap)
