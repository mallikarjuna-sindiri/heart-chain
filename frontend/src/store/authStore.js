/**
 * Auth Store using Zustand
 * Global state management for authentication
 */
import { create } from 'zustand'
import { authService } from '../services/auth'

export const useAuthStore = create((set) => ({
  user: authService.getUserFromStorage(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  
  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const data = await authService.login(credentials)
      set({ user: data.user, isAuthenticated: true, isLoading: false })
      return data
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (userData) => {
    set({ isLoading: true })
    try {
      const data = await authService.register(userData)
      set({ user: data.user, isAuthenticated: true, isLoading: false })
      return data
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    authService.logout()
    set({ user: null, isAuthenticated: false })
  },

  refreshUser: async () => {
    try {
      const user = await authService.getCurrentUser()
      set({ user })
    } catch (error) {
      set({ user: null, isAuthenticated: false })
    }
  },
}))
