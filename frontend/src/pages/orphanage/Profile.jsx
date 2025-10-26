import { useEffect, useState } from 'react'
import { MapPin, ShieldCheck, IndianRupee } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { orphanageService } from '../../services/orphanage'
import { campaignService } from '../../services/campaign'

export default function OrphanageProfile() {
  const { id } = useParams()
  const location = useLocation()
  const [tab, setTab] = useState('requests')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orphanage, setOrphanage] = useState(location.state?.orphanage || null)
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Use existing state as immediate data, then refresh from API
  const data = await orphanageService.getOrphanage(id)
  const oid = String(id || data?.id || '')
        let list = []
        try {
          // Primary: server-side filter by orphanage id
          list = await campaignService.getCampaigns({ orphanage_id: oid, limit: 50 })
          // Fallback: if server filter returns empty (enum/link mismatch during dev), fetch all and filter client-side
          if (!Array.isArray(list) || list.length === 0) {
            const all = await campaignService.getCampaigns({ limit: 100 })
            list = (all || []).filter((c) => String(c.orphanage_id) === oid || String(c?.orphanage?.id) === oid)
          }
        } catch (e) {
          // Fallback on error as well
          try {
            const all = await campaignService.getCampaigns({ limit: 100 })
            list = (all || []).filter((c) => String(c.orphanage_id) === oid || String(c?.orphanage?.id) === oid)
          } catch {}
        }
        if (mounted) {
          setOrphanage(data)
          setCampaigns(list || [])
        }
      } catch (e) {
        // If we have state data, show it even if refresh fails
        if (!location.state?.orphanage) {
          if (mounted) setError('Orphanage not found')
        } else {
          if (mounted) setError(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  if (loading && !orphanage) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-gray-500">Loading orphanage…</div>
  }

  if (error || !orphanage) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-red-600">{error || 'Not found'}</div>
  }

  const cover = orphanage.images?.[0] || orphanage.logo || '/logo.png'
  const isVerified = String(orphanage.status).toLowerCase() === 'verified'
  const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0)
  const activeCount = campaigns.filter((c) => String(c.status).toLowerCase() === 'active').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <img src={cover} alt={orphanage.name} className="w-full h-72 object-cover rounded-lg" onError={(e) => { e.currentTarget.src = '/logo.png' }} />
        </div>
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl md:text-4xl font-bold">{orphanage.name}</h1>
            {isVerified && (
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Partner
              </span>
            )}
          </div>
          <div className="mt-2 text-gray-600 flex items-center gap-3">
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {orphanage.city}, {orphanage.state}</span>
          </div>
          <p className="mt-4 text-gray-700 leading-relaxed">{orphanage.description}</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500">Total Raised</div>
              <div className="text-2xl font-semibold text-gray-900">{currency(totalRaised)}</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500">Active Campaigns</div>
              <div className="text-2xl font-semibold text-gray-900">{activeCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2">
        {[
          { key: 'requests', label: 'Campaigns' },
          { key: 'history', label: 'Funding History' },
          { key: 'reports', label: 'Impact & Reports' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md border ${
              tab === t.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
        {tab === 'requests' && (
        <div className="mt-6 space-y-6">
          {campaigns.length === 0 && (
            <div className="text-gray-600">No campaigns listed yet.</div>
          )}
          {campaigns.map((p) => {
            const goal = p.target_amount || 0
            const raised = p.raised_amount || 0
            const percent = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0
            return (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 capitalize">{String(p.category || '').toLowerCase()}</span>
                      <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">{String(p.status || '').toLowerCase()}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{p.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Raised</div>
                    <div className="font-semibold text-gray-900">{currency(raised)}</div>
                    <div className="text-xs text-gray-500">Goal: {currency(goal)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-amber-100">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                    <span>{percent}% Funded</span>
                    <span className="text-right">{currency(Math.max(goal - raised, 0))} remaining</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  {String(p.status || '').toLowerCase() === 'active' ? (
                    <Link to={`/donate/${id}/${p.id}`} className="btn btn-primary">Donate Now</Link>
                  ) : (
                    <button className="btn btn-disabled" disabled>Not open for donations</button>
                  )}
                  <Link to={`/campaigns/${p.id}`} className="btn btn-outline">Details & Reports</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'history' && (
        <div className="mt-6 text-gray-600">Funding history will appear here.</div>
      )}

      {tab === 'reports' && (
        <div className="mt-6 text-gray-600">Impact & reports will appear here.</div>
      )}
    </div>
  )
}
