/**
 * Orphanage Service
 * API calls for orphanage operations
 */
import api from './api'

export const orphanageService = {
  /**
   * Register new orphanage
   */
  register: async (orphanageData) => {
    const response = await api.post('/orphanages', orphanageData)
    return response.data
  },

  /**
   * Get my orphanage
   */
  getMyOrphanage: async () => {
    const response = await api.get('/orphanages/my')
    return response.data
  },

  /**
   * Get dashboard summary for current orphanage
   */
  getMySummary: async () => {
    const response = await api.get('/orphanages/my/summary')
    return response.data
  },

  /**
   * Get payout history for current orphanage
   */
  getMyPayouts: async () => {
    const response = await api.get('/orphanages/my/payouts')
    return response.data
  },

  

  /**
   * Get orphanage by ID
   */
  getOrphanage: async (id) => {
    const response = await api.get(`/orphanages/${id}`)
    return response.data
  },

  /**
   * List all orphanages
   */
  getOrphanages: async (params = {}) => {
    const response = await api.get('/orphanages', { params })
    return response.data
  },

  /**
   * Update orphanage
   */
  updateOrphanage: async (id, orphanageData) => {
    const response = await api.put(`/orphanages/${id}`, orphanageData)
    return response.data
  },

  /**
   * Delete orphanage
   */
  deleteOrphanage: async (id) => {
    const response = await api.delete(`/orphanages/${id}`)
    return response.data
  },

  /**
   * Upload orphanage logo (returns absolute URL)
   */
  uploadLogo: async (file) => {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post('/uploads/orphanage-logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const url = response.data?.url
    if (!url) return null
    // Ensure absolute URL pointing to backend host (not the frontend origin)
    const base = (api.defaults.baseURL || '').replace(/\/?api\/?$/, '')
    return url.startsWith('/') ? `${base}${url}` : url
  },
}
