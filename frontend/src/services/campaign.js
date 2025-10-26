/**
 * Campaign Service
 * API calls for campaign operations
 */
import api from './api'

export const campaignService = {
  /**
   * Get all campaigns with filters
   */
  getCampaigns: async (params = {}) => {
    const response = await api.get('/campaigns', { params })
    return response.data
  },

  /**
   * Public: Get active campaigns only
   */
  getActiveCampaigns: async (params = {}) => {
    const response = await api.get('/campaigns/public/active', { params })
    return response.data
  },

  /**
   * Get campaign by ID
   */
  getCampaign: async (id) => {
    const response = await api.get(`/campaigns/${id}`)
    return response.data
  },

  /**
   * Create new campaign (orphanage only)
   */
  createCampaign: async (campaignData) => {
    const response = await api.post('/campaigns', campaignData)
    return response.data
  },

  /**
   * Update campaign
   */
  updateCampaign: async (id, campaignData) => {
    const response = await api.put(`/campaigns/${id}`, campaignData)
    return response.data
  },

  /**
   * Delete campaign
   */
  deleteCampaign: async (id) => {
    const response = await api.delete(`/campaigns/${id}`)
    return response.data
  },

  /**
   * Get campaigns for the current orphanage
   */
  getMyCampaigns: async () => {
    const response = await api.get('/campaigns/my')
    return response.data
  },
}
