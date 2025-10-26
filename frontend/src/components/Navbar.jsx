/**
 * Navbar Component
 * Top navigation bar with authentication and role-based links
 */
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Menu, X, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleDashboard = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'donor':
        return '/donor/dashboard'
      case 'orphanage':
        return '/orphanage/dashboard'
      case 'admin':
        return '/admin/dashboard'
      default:
        return '/'
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={isAuthenticated ? getRoleDashboard() : '/'} className="flex items-center space-x-2">
              {/* Try to show custom logo; fall back to Heart icon if it fails */}
              {!logoError ? (
                <img
                  src="/logo.png"
                  alt="Heart-Chain Logo"
                  className="h-11 w-11 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Heart className="h-8 w-8 text-primary-600" fill="currentColor" />
              )}
              <span className="text-xl font-bold text-gray-900">Heart-Chain</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition">
              Home
            </Link>
            <Link to="/orphanages" className="text-gray-700 hover:text-primary-600 transition">
              Orphanages
            </Link>
            <Link to="/how-it-works" className="text-gray-700 hover:text-primary-600 transition">
              How It Works
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-600 transition">
              About
            </Link>

            {isAuthenticated ? (
              <>
                {/* User dropdown */}
                <div className="relative border-l pl-4">
                  <button
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user.full_name}</span>
                    <span className="badge badge-info text-xs capitalize">{user.role}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-50">
                      <div className="px-4 pb-2 border-b">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" /> Profile
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline py-2">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary py-2">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            <Link to="/" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link
              to="/orphanages"
              className="block text-gray-700 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Orphanages
            </Link>
            <Link
              to="/how-it-works"
              className="block text-gray-700 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              to="/about"
              className="block text-gray-700 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block text-gray-700 hover:text-primary-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left text-gray-700 hover:text-primary-600"
                >
                  Logout
                </button>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">{user.full_name}</p>
                  <span className="badge badge-info text-xs mt-1">{user.role}</span>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block btn btn-outline w-full text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block btn btn-primary w-full text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
