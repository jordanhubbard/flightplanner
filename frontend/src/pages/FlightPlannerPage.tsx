import React, { useState } from 'react'
import { Grid, TextField, Card, CardContent, Box, Chip, Divider, Typography } from '@mui/material'
import { Flight, Schedule, Speed, LocalGasStation } from '@mui/icons-material'
import toast from 'react-hot-toast'
import { 
  PageHeader, 
  FormSection, 
  EmptyState, 
  LoadingState, 
  ResultsSection 
} from '../components/shared'
import { useApiMutation } from '../hooks'
import { flightPlannerService } from '../services'
import { validateAirportCode } from '../utils'
import type { FlightPlan, FlightPlanRequest } from '../types'

const FlightPlannerPage: React.FC = () => {
  const [departure, setDeparture] = useState('')
  const [destination, setDestination] = useState('')
  const [aircraft, setAircraft] = useState('')
  const [departureError, setDepartureError] = useState<string>('')
  const [destinationError, setDestinationError] = useState<string>('')

  const flightPlanMutation = useApiMutation<FlightPlan, FlightPlanRequest>(
    (data) => flightPlannerService.planRoute(data),
    {
      successMessage: 'Flight plan generated successfully!',
    }
  )

  const planFlight = () => {
    const departureValidation = validateAirportCode(departure)
    const destinationValidation = validateAirportCode(destination)

    if (!departureValidation.valid) {
      setDepartureError(departureValidation.error || '')
      toast.error(departureValidation.error || 'Invalid departure airport')
      return
    }

    if (!destinationValidation.valid) {
      setDestinationError(destinationValidation.error || '')
      toast.error(destinationValidation.error || 'Invalid destination airport')
      return
    }

    setDepartureError('')
    setDestinationError('')

    flightPlanMutation.mutate({
      departure: departure.toUpperCase(),
      destination: destination.toUpperCase(),
      aircraft_type: aircraft || 'C172',
    })
  }

  const handleDepartureChange = (value: string) => {
    setDeparture(value.toUpperCase())
    if (departureError) setDepartureError('')
  }

  const handleDestinationChange = (value: string) => {
    setDestination(value.toUpperCase())
    if (destinationError) setDestinationError('')
  }

  const flightPlan = flightPlanMutation.data

  return (
    <Box>
      <PageHeader icon={<Flight />} title="VFR Flight Planner" />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormSection
            title="Flight Details"
            onSubmit={planFlight}
            buttonText="Generate Flight Plan"
            isLoading={flightPlanMutation.isLoading}
          >
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Departure Airport"
                placeholder="KPAO"
                value={departure}
                onChange={(e) => handleDepartureChange(e.target.value)}
                helperText={departureError || "Enter ICAO or IATA code"}
                error={!!departureError}
                disabled={flightPlanMutation.isLoading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destination Airport"
                placeholder="KSQL"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                helperText={destinationError || "Enter ICAO or IATA code"}
                error={!!destinationError}
                disabled={flightPlanMutation.isLoading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Aircraft Type"
                placeholder="C172"
                value={aircraft}
                onChange={(e) => setAircraft(e.target.value)}
                helperText="Optional: Aircraft type for performance calculations"
                disabled={flightPlanMutation.isLoading}
              />
            </Grid>
          </FormSection>
        </Grid>
        
        <Grid item xs={12} md={6}>
          {flightPlanMutation.isLoading ? (
            <LoadingState message="Generating flight plan..." />
          ) : flightPlan ? (
            <ResultsSection title="Flight Plan Results">
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Route: {flightPlan.departure} → {flightPlan.destination}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    {flightPlan.route.map((waypoint, index) => (
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
                          Distance: {flightPlan.distance} nm
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          Time: {Math.round(flightPlan.estimated_time)} min
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocalGasStation sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          Fuel: {flightPlan.fuel_required.toFixed(1)} gal
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {flightPlan.weather_summary && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Weather: {flightPlan.weather_summary}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </ResultsSection>
          ) : (
            <EmptyState
              icon={<Flight />}
              message="Enter flight details to generate your VFR flight plan"
            />
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default FlightPlannerPage
