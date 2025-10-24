import { useParams, Link, useLocation } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { orphanageService } from '../services/orphanage'

export default function DonatePage() {
  const { orphanageId, campaignId } = useParams()
  const location = useLocation()
  const [amount, setAmount] = useState(100)
  const [anonymous, setAnonymous] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [orphanage, setOrphanage] = useState(() => location.state?.orphanage || null)

  // Fee model (example): platform 0%, gateway 2.9%
  const fees = useMemo(() => {
    const platform = 0
    const gateway = amount * 0.029
    const total = amount + gateway + platform
    return { platform, gateway, total }
  }, [amount])

  const currency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

  const onDonate = (e) => {
    e.preventDefault()
    // TODO: integrate payment gateway (Razorpay/Stripe) using donationService
    alert(`Simulated donation of ${currency(fees.total)} to orphanage ${orphanageId}${campaignId ? ' for campaign ' + campaignId : ''}`)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (orphanage && orphanage.id === orphanageId) return
      try {
        const data = await orphanageService.getOrphanage(orphanageId)
        if (mounted) setOrphanage(data)
      } catch (e) {
        // handled globally by axios interceptor toast
      }
    })()
    return () => { mounted = false }
  }, [orphanageId])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Complete Your Donation</h1>
        <p className="text-gray-600 mt-2">
          Your contribution will directly support{' '}
          <span className="font-semibold">{orphanage?.name || `orphanage #${orphanageId}`}</span>
          {campaignId && (
            <>
              {' '}campaign <span className="font-semibold">#{campaignId}</span>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Form */}
        <form onSubmit={onDonate} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Donation Details</h2>
            <div className="mt-3">
              <label className="text-sm text-gray-600">Donation Amount (INR)</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="px-3 py-2 bg-gray-100 rounded">₹</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="input flex-1"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>
            </div>

            <label className="mt-3 flex items-center gap-2">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              <span className="text-sm">Donate Anonymously</span>
            </label>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700">Personal Information</h3>
            <input
              className="input mt-2"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!anonymous}
            />
            <input
              className="input mt-3"
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!anonymous}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700">Payment Method</h3>
            <div className="mt-2 flex items-center gap-4 text-2xl">
              <span className="font-bold text-indigo-600">stripe</span>
              <span className="font-bold text-blue-600">PayPal</span>
            </div>
            <input className="input mt-4" placeholder="Card Number" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input className="input" placeholder="MM/YY" />
              <input className="input" placeholder="CVC" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Donate {currency(fees.total)}
          </button>
        </form>

        {/* Right: Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-lg font-semibold">Payment Breakdown</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Donation Amount</span>
              <span className="font-medium">{currency(amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>
                Platform Fee <span className="text-xs text-green-600 align-top">0%</span>
              </span>
              <span className="font-medium">{currency(fees.platform)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>
                Payment Gateway Fee{' '}
                <span className="text-xs text-gray-500 align-top">(2.9%)</span>
              </span>
              <span className="font-medium">{currency(fees.gateway)}</span>
            </div>

            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-gray-600">Total Charged</span>
              <span className="text-primary-600 font-semibold">{currency(fees.total)}</span>
            </div>

            <div className="mt-3 bg-amber-50 text-amber-700 rounded-md p-3 flex items-center justify-between">
              <span>Net to Orphanage</span>
              <span className="font-semibold">{currency(amount)}</span>
            </div>

            <button onClick={onDonate} className="btn btn-primary w-full mt-4">
              Donate {currency(fees.total)}
            </button>

            <div className="mt-4 text-xs text-gray-500">
              Secure payment powered by Stripe (demo UI). In production, integrate the actual gateway and server-side verification.
            </div>

            <div className="mt-4 bg-gray-50 p-3 rounded text-xs text-gray-600">
              <div className="font-semibold">Why 0% Platform Fee?</div>
              <p>
                We believe in complete transparency. Every dollar you donate goes directly to the orphanage. We only pass on the
                unavoidable payment processing fees.
              </p>
            </div>
          </div>

          <div className="mt-6 text-sm">
            <Link to={`/orphanages/${orphanageId}`} className="text-primary-600 hover:underline">
              ← Back to Orphanage Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
