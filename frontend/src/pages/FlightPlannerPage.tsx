import React, { useState } from 'react'
import { Grid, Card, CardContent, Box, Chip, Divider, Typography } from '@mui/material'
import { Flight, Schedule, Speed } from '@mui/icons-material'
import { 
  PageHeader, 
  EmptyState, 
  LoadingState, 
  ResultsSection 
} from '../components/shared'
import FlightPlanningForm from '../components/FlightPlanningForm'
import RouteMap from '../components/RouteMap'
import RouteLegsTable from '../components/RouteLegsTable'
import ElevationProfile from '../components/ElevationProfile'
import WeatherOverlayControls, { type WeatherOverlays } from '../components/WeatherOverlayControls'
import { useApiMutation } from '../hooks'
import { flightPlannerService } from '../services'
import type { FlightPlan, FlightPlanRequest, LocalPlanRequest, RoutePlanRequest } from '../types'

const FlightPlannerPage: React.FC = () => {
  const [lastMode, setLastMode] = useState<'local' | 'route'>('route')
  const [overlays, setOverlays] = useState<WeatherOverlays>({
    clouds: { enabled: false, opacity: 0.6 },
    wind: { enabled: false, opacity: 0.7 },
    precipitation: { enabled: false, opacity: 0.7 },
    temperature: { enabled: false, opacity: 0.6 },
  })

  const routePlanMutation = useApiMutation<FlightPlan, RoutePlanRequest>((data) => flightPlannerService.plan(data), {
    successMessage: 'Route planned successfully!',
  })

  const localPlanMutation = useApiMutation<unknown, LocalPlanRequest>((data) => flightPlannerService.plan(data), {
    successMessage: 'Local plan generated successfully!',
  })

  const isLoading = routePlanMutation.isLoading || localPlanMutation.isLoading

  const planFlight = (req: FlightPlanRequest) => {
    setLastMode(req.mode)
    if (req.mode === 'route') {
      routePlanMutation.mutate(req)
      return
    }

    localPlanMutation.mutate(req)
  }

  const routePlan = routePlanMutation.data

  return (
    <Box>
      <PageHeader icon={<Flight />} title="VFR Flight Planner" />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FlightPlanningForm isLoading={isLoading} onSubmit={planFlight} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          {isLoading ? (
            <LoadingState message={lastMode === 'route' ? 'Planning route...' : 'Planning local flight...'} />
          ) : routePlan ? (
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
                        <Typography variant="body2">
                          Time: {routePlan.time_hr} hr
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

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

              <Box sx={{ mb: 2 }}>
                <WeatherOverlayControls overlays={overlays} setOverlays={setOverlays} disabled={isLoading} />
              </Box>

              <RouteMap plan={routePlan} overlays={overlays} />
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
