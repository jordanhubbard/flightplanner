import { apiClient } from './apiClient'
import type { ForecastResponse, WeatherData } from '../types'

export const weatherService = {
  getWeather: async (airport: string): Promise<WeatherData> => {
    const response = await apiClient.get<WeatherData>(`/weather/${airport}`)
    return response.data
  },

  getForecast: async (airport: string, days = 3): Promise<ForecastResponse> => {
    const response = await apiClient.get<ForecastResponse>(`/weather/${airport}/forecast`, {
      params: { days },
    })
    return response.data
  },
}
