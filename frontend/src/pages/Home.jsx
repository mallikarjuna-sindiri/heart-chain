/**
 * Home Page
 * Landing page with hero section and featured campaigns
 */
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Heart, Shield, TrendingUp, Users } from 'lucide-react'

function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px- lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            {/* Left: headline and actions */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-5">
                Transparent Donations,<br />Real Impact
              </h1>
              <p className="text-lg md:text-xl mb-6 text-primary-100 md:max-w-2xl mx-auto md:mx-0">
                Connect with verified orphanages, track your donations, and see the difference you make in children's lives.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link to="/orphanages" className="btn bg-white text-primary-600 hover:bg-gray-100 px-6 py-2.5 text-base md:text-lg">
                  Find an Orphanage
                </Link>
                {/* If user is authenticated, show dashboard link instead of register/get-started */}
                {(() => {
                  const { isAuthenticated, user } = useAuthStore()
                  if (isAuthenticated && user) {
                    const dashboardPath = (user.role === 'donor' && '/donor/dashboard') || (user.role === 'orphanage' && '/orphanage/dashboard') || (user.role === 'admin' && '/admin/dashboard') || '/'
                    return (
                      <Link to={dashboardPath} className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-6 py-2.5 text-base md:text-lg">
                        Go to Dashboard
                      </Link>
                    )
                  }
                  return (
                    <Link to="/register" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-6 py-2.5 text-base md:text-lg">
                      Get Started
                    </Link>
                  )
                })()}
              </div>
            </div>

            {/* Right: logo image */}
            <div className="flex items-center justify-center md:justify-end">
                <img
                  src="/logo.png"
                  alt="Heart-Chain Logo"
                  className="w-50 sm:w-56 md:w-[30rem] lg:w-[24rem] h-auto object-contain drop-shadow-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Heart-Chain?</h2>
            <p className="text-xl text-gray-600">Transparency and trust at every step</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Verified Orphanages</h3>
              <p className="text-gray-600">All organizations are verified by government authorities</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Track Impact</h3>
              <p className="text-gray-600">See exactly how your donations are used with detailed reports</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Direct Impact</h3>
              <p className="text-gray-600">100% of your donation goes directly to the orphanage</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Community Driven</h3>
              <p className="text-gray-600">Join thousands making a difference together</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join our community of donors and organizations creating positive change.
          </p>
          {(() => {
            const { isAuthenticated, user } = useAuthStore()
            if (isAuthenticated && user) {
              const dashboardPath = (user.role === 'donor' && '/donor/dashboard') || (user.role === 'orphanage' && '/orphanage/dashboard') || (user.role === 'admin' && '/admin/dashboard') || '/'
              return (
                <Link to={dashboardPath} className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg">
                  Go to Dashboard
                </Link>
              )
            }
            return (
              <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Register Now
              </Link>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default HomePage
