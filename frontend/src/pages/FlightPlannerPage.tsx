import React, { useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Divider,
  Typography,
  Alert,
  Button,
  Paper,
} from '@mui/material'
import { Flight, Schedule, Speed } from '@mui/icons-material'
import { PageHeader, EmptyState, LoadingState, ResultsSection } from '../components/shared'
import FlightPlanningForm from '../components/FlightPlanningForm'
import RouteMap from '../components/RouteMap'
import LocalMap from '../components/LocalMap'
import RouteLegsTable from '../components/RouteLegsTable'
import ElevationProfile from '../components/ElevationProfile'
import WeatherPanels from '../components/WeatherPanels'
import AlternateAirports from '../components/AlternateAirports'
import RouteWaypointWeatherTable from '../components/RouteWaypointWeatherTable'
import WeatherOverlayControls, { type WeatherOverlays } from '../components/WeatherOverlayControls'
import { useApiMutation } from '../hooks'
import { flightPlannerService } from '../services'
import type {
  FlightPlan,
  FlightPlanRequest,
  LocalPlanRequest,
  LocalPlanResponse,
  RoutePlanRequest,
} from '../types'

const FlightPlannerPage: React.FC = () => {
  const [lastMode, setLastMode] = useState<'local' | 'route'>('route')
  const [lastRequest, setLastRequest] = useState<FlightPlanRequest | null>(null)
  const [overlays, setOverlays] = useState<WeatherOverlays>({
    clouds: { enabled: false, opacity: 0.6 },
    wind: { enabled: false, opacity: 0.7 },
    precipitation: { enabled: false, opacity: 0.7 },
    temperature: { enabled: false, opacity: 0.6 },
  })

  const routePlanMutation = useApiMutation<FlightPlan, RoutePlanRequest>(
    (data) => flightPlannerService.plan<FlightPlan>(data),
    {
      successMessage: 'Route planned successfully!',
    },
  )

  const localPlanMutation = useApiMutation<LocalPlanResponse, LocalPlanRequest>(
    (data) => flightPlannerService.plan<LocalPlanResponse>(data),
    {
      successMessage: 'Local plan generated successfully!',
    },
  )

  const isLoading = routePlanMutation.isLoading || localPlanMutation.isLoading
  const error = routePlanMutation.error || localPlanMutation.error

  const planFlight = (req: FlightPlanRequest) => {
    setLastRequest(req)
    setLastMode(req.mode)
    if (req.mode === 'route') {
      routePlanMutation.mutate(req)
      return
    }

    localPlanMutation.mutate(req)
  }

  const routePlan = routePlanMutation.data
  const localPlan = localPlanMutation.data

  return (
    <Box>
      <PageHeader icon={<Flight />} title="VFR Flight Planner" />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FlightPlanningForm isLoading={isLoading} onSubmit={planFlight} />
        </Grid>

        <Grid item xs={12} md={8}>
          {isLoading ? (
            <LoadingState
              message={lastMode === 'route' ? 'Planning route...' : 'Planning local flight...'}
            />
          ) : error ? (
            <Paper sx={{ p: 3 }} role="alert">
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    disabled={!lastRequest}
                    onClick={() => lastRequest && planFlight(lastRequest)}
                  >
                    Retry
                  </Button>
                }
              >
                {error.message || 'Request failed. Please try again.'}
              </Alert>
            </Paper>
          ) : lastMode === 'route' && routePlan ? (
            <ResultsSection title="Route Results">
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Route: {routePlan.route.join(' → ')}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    {routePlan.route.map((waypoint, index) => (
                      <Chip
                        key={index}
                        label={waypoint}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Speed sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          Distance: {routePlan.distance_nm} nm
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">Time: {routePlan.time_hr} hr</Typography>
                      </Box>
                    </Grid>

                    {routePlan.groundspeed_kt != null && (
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Speed sx={{ mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">
                            Groundspeed: {routePlan.groundspeed_kt} kt
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {routePlan.headwind_kt != null && (
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Speed sx={{ mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">
                            {routePlan.headwind_kt >= 0 ? 'Headwind' : 'Tailwind'}:{' '}
                            {Math.abs(routePlan.headwind_kt)} kt
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <RouteWaypointWeatherTable plan={routePlan} />
                </CardContent>
              </Card>

              <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <WeatherOverlayControls
                    overlays={overlays}
                    setOverlays={setOverlays}
                    disabled={isLoading}
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <RouteMap plan={routePlan} overlays={overlays} />
                </Grid>
              </Grid>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <RouteLegsTable plan={routePlan} />
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <ElevationProfile plan={routePlan} />
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <WeatherPanels airports={routePlan.route} />
                </CardContent>
              </Card>

              {routePlan.alternates && routePlan.alternates.length > 0 ? (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <AlternateAirports alternates={routePlan.alternates} />
                  </CardContent>
                </Card>
              ) : null}
            </ResultsSection>
          ) : lastMode === 'local' && localPlan ? (
            <ResultsSection title="Local Results">
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Center: {localPlan.airport} (radius {localPlan.radius_nm} nm)
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {localPlan.nearby_airports.slice(0, 20).map((ap) => (
                      <Chip
                        key={ap.icao || ap.iata}
                        label={`${ap.icao || ap.iata} (${ap.distance_nm.toFixed(1)} nm)`}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>

              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={4}>
                  <WeatherOverlayControls
                    overlays={overlays}
                    setOverlays={setOverlays}
                    disabled={isLoading}
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <LocalMap plan={localPlan} overlays={overlays} />
                </Grid>
              </Grid>
            </ResultsSection>
          ) : (
            <EmptyState
              icon={<Flight />}
              message="Select a planning mode and enter details to generate a plan"
            />
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default FlightPlannerPage
