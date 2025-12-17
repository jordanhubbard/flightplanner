import { apiClient } from './apiClient'
import type { FlightPlan, FlightPlanRequest } from '../types'

export const flightPlannerService = {
  planRoute: async (data: FlightPlanRequest): Promise<FlightPlan> => {
    const response = await apiClient.post<FlightPlan>('/plan_route', data)
    return response.data
  },
}
