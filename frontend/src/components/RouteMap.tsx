import React, { useMemo } from 'react'
import { Box } from '@mui/material'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { useRouteWeather } from '../hooks'
import { getRuntimeEnv } from '../utils'
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
  const owmKey = getRuntimeEnv('VITE_OPENWEATHERMAP_API_KEY')
  const windBarbsEnabled = Boolean(overlays?.wind.enabled)
  const routeWeather = useRouteWeather(points, 12, windBarbsEnabled)

  const windIcon = (direction: number, speed: number) => {
    const rot = Number.isFinite(direction) ? direction : 0
    const spd = Number.isFinite(speed) ? Math.round(speed) : 0

    return L.divIcon({
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: `
        <div style="
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${rot}deg);
          font-size: 18px;
          line-height: 1;
          color: #111;
          text-shadow: 0 0 2px rgba(255,255,255,0.9);
        ">
          ↑
        </div>
        <div style="
          position: relative;
          top: -26px;
          left: 16px;
          font-size: 10px;
          color: #111;
          text-shadow: 0 0 2px rgba(255,255,255,0.9);
        ">${spd}</div>
      `,
    })
  }

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

        {windBarbsEnabled &&
          routeWeather.data?.points
            .filter((p) => p.wind_speed_kt != null && p.wind_direction != null)
            .map((p, idx) => (
              <Marker
                key={idx}
                position={[p.latitude, p.longitude]}
                icon={windIcon(p.wind_direction as number, p.wind_speed_kt as number)}
              >
                <Popup>
                  Wind: {Math.round(p.wind_speed_kt as number)} kt @ {p.wind_direction}°
                </Popup>
              </Marker>
            ))}

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
