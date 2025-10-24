/**
 * User Service
 * Profile operations for current authenticated user
 */
import api from './api'

export const userService = {
  getProfile: async () => {
    const res = await api.get('/users/profile')
    return res.data
  },

  updateProfile: async (payload) => {
    const res = await api.put('/users/profile', payload)
    return res.data
  },

  uploadProfileImage: async (file) => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post('/users/profile/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
