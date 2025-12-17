import { apiClient } from './apiClient'
import type { WeatherData } from '../types'

export const weatherService = {
  getWeather: async (airport: string): Promise<WeatherData> => {
    const response = await apiClient.get<WeatherData>(`/weather/${airport}`)
    return response.data
  },
}
