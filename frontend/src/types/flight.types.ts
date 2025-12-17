export interface FlightPlan {
  departure: string
  destination: string
  route: string[]
  distance: number
  estimated_time: number
  fuel_required: number
  weather_summary: string
}

export interface FlightPlanRequest {
  departure: string
  destination: string
  aircraft_type?: string
}
