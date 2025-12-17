import React, { useState, useCallback } from 'react'
import { Grid, TextField, Card, CardContent, Box, InputAdornment, Typography } from '@mui/material'
import { Cloud, Thermostat, Air, Visibility } from '@mui/icons-material'
import toast from 'react-hot-toast'
import { 
  PageHeader, 
  FormSection, 
  EmptyState, 
  LoadingState, 
  ResultsSection,
  SearchHistoryDropdown,
  FavoriteButton,
} from '../components/shared'
import { useApiMutation, useSearchHistory, useFavorites } from '../hooks'
import { weatherService } from '../services'
import { validateAirportCode } from '../utils'
import type { WeatherData } from '../types'

const WeatherPage: React.FC = () => {
  const [airport, setAirport] = useState('')
  const [validationError, setValidationError] = useState<string>('')
  const [showHistory, setShowHistory] = useState(false)

  const { addToHistory, getRecentSearches, clearHistory } = useSearchHistory()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()

  const weatherMutation = useApiMutation<WeatherData, string>(
    (airportCode) => weatherService.getWeather(airportCode),
    {
      successMessage: 'Weather data retrieved successfully!',
      onSuccess: () => {
        addToHistory(airport.toUpperCase(), 'weather')
      },
    }
  )

  const getWeather = () => {
    const validation = validateAirportCode(airport)
    if (!validation.valid) {
      setValidationError(validation.error || '')
      toast.error(validation.error || 'Invalid airport code')
      return
    }
    
    setValidationError('')
    setShowHistory(false)
    weatherMutation.mutate(airport.toUpperCase())
  }

  const handleAirportChange = (value: string) => {
    setAirport(value.toUpperCase())
    if (validationError) {
      setValidationError('')
    }
  }

  const handleFavoriteToggle = useCallback(() => {
    const currentAirport = weatherMutation.data?.airport || airport.toUpperCase()
    if (isFavorite(currentAirport)) {
      removeFavorite(currentAirport)
      toast.success('Removed from favorites')
    } else {
      addFavorite(currentAirport, weatherMutation.data?.airport)
      toast.success('Added to favorites')
    }
  }, [airport, weatherMutation.data, isFavorite, addFavorite, removeFavorite])

  const handleHistorySelect = useCallback((query: string) => {
    setAirport(query)
    setShowHistory(false)
    // Auto-fetch weather for selected item
    const validation = validateAirportCode(query)
    if (validation.valid) {
      weatherMutation.mutate(query)
    }
  }, [weatherMutation])

  const recentSearches = getRecentSearches('weather', 5)

  const weatherData = weatherMutation.data
  const currentAirport = weatherData?.airport || airport.toUpperCase()

  return (
    <Box>
      <PageHeader icon={<Cloud />} title="Weather Information" />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormSection
            title="Airport Weather"
            onSubmit={getWeather}
            buttonText="Get Weather"
            isLoading={weatherMutation.isLoading}
          >
            <Grid item xs={12}>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  label="Airport Code"
                  placeholder="KPAO"
                  value={airport}
                  onChange={(e) => handleAirportChange(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                  helperText={validationError || "Enter ICAO or IATA code"}
                  error={!!validationError}
                  disabled={weatherMutation.isLoading}
                  InputProps={{
                    endAdornment: currentAirport && (
                      <InputAdornment position="end">
                        <FavoriteButton
                          isFavorite={isFavorite(currentAirport)}
                          onToggle={handleFavoriteToggle}
                          size="small"
                          label={currentAirport}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
                {showHistory && recentSearches.length > 0 && (
                  <SearchHistoryDropdown
                    items={recentSearches}
                    onSelect={handleHistorySelect}
                    onClear={() => {
                      clearHistory()
                      toast.success('Search history cleared')
                    }}
                    emptyMessage="No recent weather searches"
                  />
                )}
              </Box>
            </Grid>
          </FormSection>
        </Grid>
        
        <Grid item xs={12} md={6}>
          {weatherMutation.isLoading ? (
            <LoadingState message="Fetching weather data..." />
          ) : weatherData ? (
            <ResultsSection title={`Current Weather - ${weatherData.airport}`}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {weatherData.conditions}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Thermostat sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">
                          {weatherData.temperature}°F
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Air sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">
                          {weatherData.wind_direction}° @ {weatherData.wind_speed} kts
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Visibility sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">
                          {weatherData.visibility} SM
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Cloud sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">
                          {weatherData.ceiling} ft
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {weatherData.metar && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        METAR:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                        {weatherData.metar}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </ResultsSection>
          ) : (
            <EmptyState
              icon={<Cloud />}
              message="Enter an airport code to get current weather conditions"
            />
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default WeatherPage
