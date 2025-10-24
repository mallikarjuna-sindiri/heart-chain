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
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
                <Link to="/profile" className="text-gray-700 hover:text-primary-600 transition">
                  Profile
                </Link>
                <div className="flex items-center space-x-2 border-l pl-4">
                  <span className="text-sm text-gray-600">{user.full_name}</span>
                  <span className="badge badge-info text-xs">{user.role}</span>
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
