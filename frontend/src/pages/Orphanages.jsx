import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ShieldCheck } from 'lucide-react'
import { orphanageService } from '../services/orphanage'

function OrphanagesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Show only verified (registered) orphanages from backend
        const data = await orphanageService.getOrphanages({ status: 'verified' })
        if (mounted) setItems(data)
      } catch (e) {
        if (mounted) setError('Failed to load orphanages')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">Verified Orphanages</h1>
        <p className="text-gray-600 mt-2">
          Every orphanage on our platform is thoroughly vetted and verified. Choose where you want to make an impact.
        </p>
      </div>

      {loading && (
        <div className="text-center text-gray-500">Loading orphanages…</div>
      )}

      {error && (
        <div className="text-center text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.length === 0 && (
            <div className="col-span-full text-center text-gray-500">No verified orphanages found.</div>
          )}
          {items.map((o) => {
            const img = o.logo || (o.images && o.images[0]) || '/logo.png'
            const isVerified = String(o.status).toLowerCase() === 'verified'
            return (
          <div key={o.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative h-56">
              <img src={img} alt={o.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/logo.png' }} />
              {isVerified && (
                <span className="absolute top-3 right-3 bg-white/90 text-green-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold">{o.name}</h3>
              <div className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {o.city}, {o.state}
              </div>

              {/* Basic details pulled directly from orphanage record */}
              <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Capacity</div>
                  <div className="font-medium">{o.capacity}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Current Occupancy</div>
                  <div className="font-medium">{o.current_occupancy}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Link to={`/orphanages/${o.id}`} state={{ orphanage: o }} className="btn btn-primary flex-1">
                  View Profile
                </Link>
                <Link to={`/donate/${o.id}`} className="btn btn-outline flex-1">
                  Donate
                </Link>
              </div>
            </div>
          </div>
            )})}
        </div>
      )}
    </div>
  )
}

export default OrphanagesPage
