import React, { useState } from 'react'
import { Grid, TextField, Card, CardContent, Box, Chip, Divider, Typography } from '@mui/material'
import { Flight, Schedule, Speed } from '@mui/icons-material'
import toast from 'react-hot-toast'
import { 
  PageHeader, 
  FormSection, 
  EmptyState, 
  LoadingState, 
  ResultsSection 
} from '../components/shared'
import ModeSelector, { type PlanMode } from '../components/ModeSelector'
import { useApiMutation } from '../hooks'
import { flightPlannerService } from '../services'
import { validateAirportCode } from '../utils'
import type { FlightPlan, LocalPlanRequest, RoutePlanRequest } from '../types'

const FlightPlannerPage: React.FC = () => {
  const [mode, setMode] = useState<PlanMode>('route')

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [airport, setAirport] = useState('')

  const [speed, setSpeed] = useState<number>(110)
  const [altitude, setAltitude] = useState<number>(5500)
  const [radiusNm, setRadiusNm] = useState<number>(25)

  const [originError, setOriginError] = useState<string>('')
  const [destinationError, setDestinationError] = useState<string>('')
  const [airportError, setAirportError] = useState<string>('')

  const routePlanMutation = useApiMutation<FlightPlan, RoutePlanRequest>((data) => flightPlannerService.plan(data), {
    successMessage: 'Route planned successfully!',
  })

  const localPlanMutation = useApiMutation<unknown, LocalPlanRequest>((data) => flightPlannerService.plan(data), {
    successMessage: 'Local plan generated successfully!',
  })

  const isLoading = routePlanMutation.isLoading || localPlanMutation.isLoading

  const planFlight = () => {
    if (mode === 'route') {
      const originValidation = validateAirportCode(origin)
      const destinationValidation = validateAirportCode(destination)

      if (!originValidation.valid) {
        setOriginError(originValidation.error || '')
        toast.error(originValidation.error || 'Invalid origin airport')
        return
      }

      if (!destinationValidation.valid) {
        setDestinationError(destinationValidation.error || '')
        toast.error(destinationValidation.error || 'Invalid destination airport')
        return
      }

      setOriginError('')
      setDestinationError('')
      setAirportError('')

      routePlanMutation.mutate({
        mode: 'route',
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        speed,
        speed_unit: 'knots',
        altitude,
        avoid_airspaces: false,
        avoid_terrain: false,
      })
      return
    }

    const airportValidation = validateAirportCode(airport)
    if (!airportValidation.valid) {
      setAirportError(airportValidation.error || '')
      toast.error(airportValidation.error || 'Invalid airport')
      return
    }

    setAirportError('')
    setOriginError('')
    setDestinationError('')

    localPlanMutation.mutate({
      mode: 'local',
      airport: airport.toUpperCase(),
      radius_nm: radiusNm,
    })
  }

  const routePlan = routePlanMutation.data

  return (
    <Box>
      <PageHeader icon={<Flight />} title="VFR Flight Planner" />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormSection
            title="Planning"
            onSubmit={planFlight}
            buttonText={mode === 'route' ? 'Plan Route' : 'Plan Local Flight'}
            isLoading={isLoading}
          >
            <Grid item xs={12}>
              <ModeSelector mode={mode} onChange={setMode} disabled={isLoading} />
            </Grid>
            
            {mode === 'route' ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Origin"
                    placeholder="KPAO"
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value.toUpperCase())
                      if (originError) setOriginError('')
                    }}
                    helperText={originError || 'Enter ICAO or IATA code'}
                    error={!!originError}
                    disabled={isLoading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Destination"
                    placeholder="KSQL"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value.toUpperCase())
                      if (destinationError) setDestinationError('')
                    }}
                    helperText={destinationError || 'Enter ICAO or IATA code'}
                    error={!!destinationError}
                    disabled={isLoading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cruise Speed (kt)"
                    type="number"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    disabled={isLoading}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cruise Altitude (ft)"
                    type="number"
                    value={altitude}
                    onChange={(e) => setAltitude(Number(e.target.value))}
                    disabled={isLoading}
                    inputProps={{ min: 0, step: 500 }}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Airport"
                    placeholder="KPAO"
                    value={airport}
                    onChange={(e) => {
                      setAirport(e.target.value.toUpperCase())
                      if (airportError) setAirportError('')
                    }}
                    helperText={airportError || 'Enter ICAO or IATA code'}
                    error={!!airportError}
                    disabled={isLoading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Radius (NM)"
                    type="number"
                    value={radiusNm}
                    onChange={(e) => setRadiusNm(Number(e.target.value))}
                    disabled={isLoading}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </>
            )}
          </FormSection>
        </Grid>
        
        <Grid item xs={12} md={6}>
          {isLoading ? (
            <LoadingState message={mode === 'route' ? 'Planning route...' : 'Planning local flight...'} />
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
