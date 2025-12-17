import { apiClient } from './apiClient'
import type { FlightPlan, FlightPlanRequest } from '../types'

export const flightPlannerService = {
  plan: async (data: FlightPlanRequest): Promise<FlightPlan> => {
    const response = await apiClient.post<FlightPlan>('/plan', data)
    return response.data
  },
}
