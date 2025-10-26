import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { campaignService } from '../services/campaign'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Prefer active campaigns first, then include approved + pending_approval
        const [active, approved, pending] = await Promise.all([
          campaignService.getActiveCampaigns({ limit: 30 }),
          campaignService.getCampaigns({ status: 'approved', limit: 30 }),
          campaignService.getCampaigns({ status: 'pending_approval', limit: 30 }),
        ])

        const byId = new Map()
        for (const c of active || []) byId.set(c.id, c)
        for (const c of approved || []) if (!byId.has(c.id)) byId.set(c.id, c)
        for (const c of pending || []) if (!byId.has(c.id)) byId.set(c.id, c)

        let data = Array.from(byId.values())

        // Hard fallback in case something failed — fetch all and client-filter to known statuses
        if (!data || data.length === 0) {
          const all = await campaignService.getCampaigns({ limit: 60 })
          const isDisplayable = (s) => {
            const v = String(s || '').toLowerCase().trim()
            return v === 'active' || v.endsWith('.active') || v === 'approved' || v.endsWith('.approved') || v === 'pending_approval' || v.endsWith('.pending_approval')
          }
          data = (all || []).filter((c) => isDisplayable(c.status))
        }
        if (mounted) setCampaigns(data)
      } catch (e) {
        if (mounted) setError('Failed to load campaigns')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Active Campaigns</h1>
        <p className="text-gray-600 mt-1">Donate to verified campaigns and track impact transparently.</p>
      </div>

      {loading && <div className="text-gray-500">Loading campaigns…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        campaigns.length === 0 ? (
          <div className="text-gray-500">No active campaigns at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaigns.map((c) => {
              const progress = Math.min((c.raised_amount / (c.target_amount || 1)) * 100, 100)
              return (
                <div key={c.id} className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{c.title}</h3>
                      <div className="text-sm text-gray-500">{c.orphanage_name}</div>
                    </div>
                    <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700">{c.category}</span>
                  </div>

                  <p className="text-sm text-gray-600 mt-3 line-clamp-3">{c.description}</p>

                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-primary-500 rounded" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Raised ₹{(c.raised_amount || 0).toLocaleString('en-IN')}</span>
                      <span>Target ₹{(c.target_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <Link to={`/campaigns/${c.id}`} className="btn btn-outline">Details</Link>
                    <Link to={`/donate/${c.orphanage_id || ''}/${c.id}`} className="btn btn-primary">Donate</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
