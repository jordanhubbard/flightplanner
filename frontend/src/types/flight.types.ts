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

  fuel_stops?: string[] | null
  fuel_burn_gph?: number | null
  reserve_minutes?: number | null
  fuel_required_gal?: number | null
  fuel_required_with_reserve_gal?: number | null

  wind_speed_kt?: number | null
  wind_direction_deg?: number | null
  headwind_kt?: number | null
  crosswind_kt?: number | null
  groundspeed_kt?: number | null
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

  plan_fuel_stops?: boolean
  aircraft_range_nm?: number
  max_leg_distance?: number
  fuel_burn_gph?: number
  reserve_minutes?: number
  fuel_strategy?: 'time' | 'economy'
  apply_wind?: boolean
}

export type LocalPlanRequest = {
  mode: 'local'
  airport: string
  radius_nm?: number
}

export type FlightPlanRequest = RoutePlanRequest | LocalPlanRequest
