/**
 * Register Page
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Heart } from 'lucide-react'
import { orphanageService } from '../services/orphanage'
import { authService } from '../services/auth'

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'donor',
    phone: '',
  })

  const [orgData, setOrgData] = useState({
    name: '',
    registration_number: '',
    description: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    capacity: '',
    current_occupancy: '0',
    established_year: '',
    logo: '',
  })
  const [logoPreview, setLogoPreview] = useState('')

  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleOrgChange = (e) => {
    const { name, value } = e.target
    setOrgData({ ...orgData, [name]: value })
  }

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await orphanageService.uploadLogo(file)
      setOrgData((d) => ({ ...d, logo: url }))
      setLogoPreview(URL.createObjectURL(file))
      toast.success('Logo uploaded')
    } catch (err) {
      console.error('Logo upload failed', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Match backend password rules: min 8, at least one uppercase, at least one digit
    const pwd = formData.password
    if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/\d/.test(pwd)) {
      toast.error('Password must be 8+ chars, include an uppercase letter and a digit')
      return
    }

    try {
      setSubmitting(true)
      const { confirmPassword, ...registerData } = formData

      // Validate required org fields BEFORE creating any account (atomic behavior)
      if (registerData.role === 'orphanage') {
  const required = ['name','registration_number','description','address','city','state','pincode','capacity','current_occupancy','established_year','phone','logo']
        for (const key of required) {
          if (!orgData[key] || String(orgData[key]).trim() === '') {
            toast.error(`Please fill ${key.replace('_',' ')}`)
            setSubmitting(false)
            return
          }
        }
        const capacity = parseInt(orgData.capacity, 10)
        const current_occupancy = parseInt(orgData.current_occupancy, 10)
        const established_year = parseInt(orgData.established_year, 10)
        if (Number.isNaN(capacity) || capacity <= 0) {
          toast.error('Capacity must be a positive number')
          setSubmitting(false)
          return
        }
        if (Number.isNaN(current_occupancy) || current_occupancy < 0) {
          toast.error('Current occupancy must be 0 or more')
          setSubmitting(false)
          return
        }
        if (Number.isNaN(established_year) || established_year < 1800) {
          toast.error('Please enter a valid established year')
          setSubmitting(false)
          return
        }

        // Single-step atomic registration for orphanage
        const payload = {
          email: registerData.email,
          password: registerData.password,
          full_name: registerData.full_name,
          phone: registerData.phone || orgData.phone,
          orphanage: {
            name: orgData.name,
            registration_number: orgData.registration_number,
            description: orgData.description,
            email: registerData.email,
            phone: orgData.phone || registerData.phone,
            website: orgData.website || undefined,
            address: orgData.address,
            city: orgData.city,
            state: orgData.state,
            pincode: orgData.pincode,
            country: 'India',
            capacity,
            current_occupancy,
            established_year,
            logo: orgData.logo,
            images: [],
          },
        }

        const data = await authService.registerOrphanage(payload)
        toast.success('Registration successful!')
        navigate('/orphanage/dashboard')
        return
      }

      // Donor flow (simple user registration)
      const data = await register(registerData)
      toast.success('Registration successful!')
      navigate('/donor/dashboard')
    } catch (error) {
      // Handle duplicate email more clearly
      const detail = error?.response?.data?.detail
      if (error?.response?.status === 400 && typeof detail === 'string' && detail.toLowerCase().includes('email')) {
        toast.error('This email is already registered. Please sign in.')
        navigate('/login')
      }
      console.error('Registration error:', error?.response?.data || error?.message || error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 text-primary-600 mx-auto mb-4" fill="currentColor" />
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">Join Heart-Chain and start making a difference</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="input"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="input"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <select
                id="role"
                name="role"
                className="input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="donor">Donor</option>
                <option value="orphanage">Orphanage</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters with uppercase and number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            {formData.role === 'orphanage' && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Orphanage Details</h3>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                  <input id="name" name="name" type="text" className="input" placeholder="Hope Children's Home" value={orgData.name} onChange={handleOrgChange} required={formData.role==='orphanage'} />
                </div>

                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                  <input id="registration_number" name="registration_number" type="text" className="input" placeholder="ORG123456" value={orgData.registration_number} onChange={handleOrgChange} required={formData.role==='orphanage'} />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea id="description" name="description" className="input min-h-24" placeholder="Provide a brief description of your organization" value={orgData.description} onChange={handleOrgChange} required={formData.role==='orphanage'} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">Organization Logo</label>
                    <input id="logo" name="logo" type="file" accept="image/*" required className="input" onChange={handleLogoChange} />
                    { (logoPreview || orgData.logo) && (
                      <img src={logoPreview || orgData.logo} alt="Logo Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Org Phone</label>
                    <input id="phone" name="phone" type="tel" required className="input" placeholder="+91 98765 43210" value={orgData.phone} onChange={handleOrgChange} />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">Website (optional)</label>
                    <input id="website" name="website" type="url" className="input" placeholder="https://example.org" value={orgData.website} onChange={handleOrgChange} />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input id="address" name="address" type="text" className="input" placeholder="123 Main Street" value={orgData.address} onChange={handleOrgChange} required={formData.role==='orphanage'} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input id="city" name="city" type="text" className="input" value={orgData.city} onChange={handleOrgChange} required={formData.role==='orphanage'} />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input id="state" name="state" type="text" className="input" value={orgData.state} onChange={handleOrgChange} required={formData.role==='orphanage'} />
                  </div>
                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input id="pincode" name="pincode" type="text" className="input" value={orgData.pincode} onChange={handleOrgChange} required={formData.role==='orphanage'} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                    <input id="capacity" name="capacity" type="number" min="1" className="input" value={orgData.capacity} onChange={handleOrgChange} required={formData.role==='orphanage'} />
                  </div>
                  <div>
                    <label htmlFor="current_occupancy" className="block text-sm font-medium text-gray-700 mb-2">Current Occupancy</label>
                    <input id="current_occupancy" name="current_occupancy" type="number" min="0" required className="input" value={orgData.current_occupancy} onChange={handleOrgChange} />
                  </div>
                  <div>
                    <label htmlFor="established_year" className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
                    <input id="established_year" name="established_year" type="number" min="1800" max="2100" required className="input" value={orgData.established_year} onChange={handleOrgChange} />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || submitting}
              className="btn btn-primary w-full py-3"
            >
              {isLoading || submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
