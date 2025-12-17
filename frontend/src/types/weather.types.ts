export interface WeatherData {
  airport: string
  conditions: string
  temperature: number
  wind_speed: number
  wind_direction: number
  visibility: number
  ceiling: number
  metar: string
}

export interface DailyForecast {
  date: string
  temp_max_f: number | null
  temp_min_f: number | null
  precipitation_mm: number | null
  wind_speed_max_kt: number | null
}

export interface ForecastResponse {
  airport: string
  days: number
  daily: DailyForecast[]
}

export interface RouteWeatherPoint {
  latitude: number
  longitude: number
  temperature_f?: number | null
  wind_speed_kt?: number | null
  wind_direction?: number | null
  time?: string | null
}

export interface RouteWeatherResponse {
  points: RouteWeatherPoint[]
}
