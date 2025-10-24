/**
 * Admin Service
 * API calls for admin operations
 */
import api from './api'

export const adminService = {
  /**
   * Get admin dashboard statistics
   */
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard')
    return response.data
  },

  /**
   * Verify orphanage
   */
  verifyOrphanage: async (orphanageId, verificationData) => {
    // Backend expects simple params (not JSON body), send as query params
    const response = await api.post(
      `/admin/orphanages/${orphanageId}/verify`,
      null,
      { params: verificationData }
    )
    return response.data
  },

  /**
   * Approve campaign
   */
  approveCampaign: async (campaignId, approvalData) => {
    const response = await api.post(
      `/admin/campaigns/${campaignId}/approve`,
      null,
      { params: approvalData }
    )
    return response.data
  },

  /**
   * Disburse funds
   */
  disburseFunds: async (campaignId, disbursementData) => {
    const response = await api.post(
      `/admin/campaigns/${campaignId}/disburse`,
      null,
      { params: disbursementData }
    )
    return response.data
  },

  /**
   * Get pending verifications
   */
  getPendingVerifications: async () => {
    const response = await api.get('/admin/pending-verifications')
    return response.data
  },
}
