/**
 * Report Service
 * API calls for report operations
 */
import api from './api'

export const reportService = {
  /**
   * Submit utilization report
   */
  submitReport: async (reportData) => {
    const response = await api.post('/reports', reportData)
    return response.data
  },

  /**
   * Get reports for a campaign
   */
  getCampaignReports: async (campaignId) => {
    const response = await api.get(`/reports/campaign/${campaignId}`)
    return response.data
  },

  /**
   * Get report by ID
   */
  getReport: async (id) => {
    const response = await api.get(`/reports/${id}`)
    return response.data
  },

  /**
   * List reports
   */
  getReports: async (params = {}) => {
    const response = await api.get('/reports', { params })
    return response.data
  },

  /**
   * Verify report (admin only)
   */
  verifyReport: async (id, verificationData) => {
    const response = await api.post(`/reports/${id}/verify`, verificationData)
    return response.data
  },
}
