export type PlanMode = 'local' | 'route'

export type SpeedUnit = 'knots' | 'mph'

export interface Segment {
  start: [number, number]
  end: [number, number]
  type: 'climb' | 'cruise' | 'descent'
  vfr_altitude: number
}

export interface FlightPlan {
  route: string[]
  distance_nm: number
  time_hr: number
  origin_coords: [number, number]
  destination_coords: [number, number]
  segments: Segment[]
}

export type RoutePlanRequest = {
  mode: 'route'
  origin: string
  destination: string
  speed: number
  speed_unit: SpeedUnit
  altitude: number
  avoid_airspaces?: boolean
  avoid_terrain?: boolean
}

export type LocalPlanRequest = {
  mode: 'local'
  airport: string
  radius_nm?: number
}

export type FlightPlanRequest = RoutePlanRequest | LocalPlanRequest
