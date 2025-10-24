/**
 * Footer Component
 */
import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Heart-Chain Logo" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-white">Heart-Chain</span>
            </div>
            <p className="text-sm">
              Building transparent connections between donors and orphanages to create lasting impact.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/orphanages" className="hover:text-primary-500 transition">Orphanages</Link></li>
              <li><Link to="/about" className="hover:text-primary-500 transition">About Us</Link></li>
              <li><Link to="/register" className="hover:text-primary-500 transition">Get Started</Link></li>
            </ul>
          </div>

          {/* For Organizations */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Organizations</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-primary-500 transition">Register Orphanage</Link></li>
              <li><Link to="/login" className="hover:text-primary-500 transition">Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@heartchain.org</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Mumbai, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Heart-Chain. All rights reserved.</p>
          <p className="mt-2">Building a transparent future for orphanage support.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
