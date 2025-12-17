import { apiClient } from './apiClient'
import type { FlightPlanRequest } from '../types'

export const flightPlannerService = {
  plan: async <TResponse>(data: FlightPlanRequest): Promise<TResponse> => {
    const response = await apiClient.post<TResponse>('/plan', data)
    return response.data
  },
}
