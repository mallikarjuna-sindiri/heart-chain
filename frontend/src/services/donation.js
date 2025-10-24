/**
 * Donation Service
 * API calls for donation operations
 */
import api from './api'

export const donationService = {
  /**
   * Create Razorpay order for donation
   */
  createOrder: async (donationData) => {
    const response = await api.post('/donations/create-order', donationData)
    return response.data
  },

  /**
   * Verify payment after Razorpay checkout
   */
  verifyPayment: async (paymentData) => {
    const response = await api.post('/donations/verify-payment', paymentData)
    return response.data
  },

  /**
   * Get my donations
   */
  getMyDonations: async () => {
    const response = await api.get('/donations/my-donations')
    return response.data
  },

  /**
   * Get donation by ID
   */
  getDonation: async (id) => {
    const response = await api.get(`/donations/${id}`)
    return response.data
  },
}
