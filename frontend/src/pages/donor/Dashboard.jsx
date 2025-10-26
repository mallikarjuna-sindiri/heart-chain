import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { orphanageService } from '../../services/orphanage'
import { campaignService } from '../../services/campaign'
import { reportService } from '../../services/report'
import { useAuthStore } from '../../store/authStore'

export default function DonorDashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [orphanages, setOrphanages] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [activeCount, setActiveCount] = useState(0)
  const [reports, setReports] = useState([])

  const firstName = useMemo(() => {
    const name = user?.full_name || user?.name || ''
    if (!name) return user?.email || 'Donor'
    return name.split(' ')[0]
  }, [user])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        let [orgs, activeCamps, approvedCamps, pendingCamps, reps] = await Promise.all([
          orphanageService.getOrphanages({ status: 'verified', limit: 6 }),
          campaignService.getActiveCampaigns({ limit: 6 }),
          campaignService.getCampaigns({ status: 'approved', limit: 6 }),
          campaignService.getCampaigns({ status: 'pending_approval', limit: 6 }),
          reportService.getRecentPublicReports(6),
        ])
        // Fallback: if no active returned (enum mismatch or serialization), fetch all and filter client-side
        let allForFallback = null
        if (activeCamps?.length === 0) {
          try {
            const all = await campaignService.getCampaigns({ limit: 12 })
            allForFallback = all
            const isActive = (s) => {
              const v = String(s || '').toLowerCase().trim()
              // Match 'active' or enum-like 'campaignstatus.active'
              return v === 'active' || v.endsWith('.active')
            }
            activeCamps = (all || []).filter((c) => isActive(c.status))
          } catch (_) {
            // ignore fallback error
          }
        }
        // Fallback for approved list too (in case enum serialization differs)
        if (approvedCamps?.length === 0) {
          try {
            if (!allForFallback) {
              allForFallback = await campaignService.getCampaigns({ limit: 12 })
            }
            const isApproved = (s) => {
              const v = String(s || '').toLowerCase().trim()
              return v === 'approved' || v.endsWith('.approved')
            }
            approvedCamps = (allForFallback || []).filter((c) => isApproved(c.status))
          } catch (_) {}
        }
        // Fallback for pending_approval as well
        if (pendingCamps?.length === 0) {
          try {
            if (!allForFallback) {
              allForFallback = await campaignService.getCampaigns({ limit: 12 })
            }
            const isPending = (s) => {
              const v = String(s || '').toLowerCase().trim()
              return v === 'pending_approval' || v.endsWith('.pending_approval')
            }
            pendingCamps = (allForFallback || []).filter((c) => isPending(c.status))
          } catch (_) {}
        }
        if (!active) return
        setOrphanages(orgs)
        // Merge active + approved (avoid duplicates), show active first
        const byId = new Map()
        for (const c of activeCamps) byId.set(c.id, c)
  for (const c of approvedCamps) if (!byId.has(c.id)) byId.set(c.id, c)
  for (const c of pendingCamps) if (!byId.has(c.id)) byId.set(c.id, c)
        let merged = Array.from(byId.values())
        // Final fallback: if still empty, show whatever we have (top N) to avoid a blank state
        if ((!merged || merged.length === 0) && allForFallback && allForFallback.length) {
          merged = allForFallback.slice(0, 6)
        }
        setCampaigns(merged)
        setActiveCount(activeCamps?.length || 0)
        setReports(reps)
      } catch (_) {
        // errors handled globally by axios interceptor
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const Stat = ({ label, value }) => (
    <div className="p-4 bg-white rounded-md border text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading dashboard…</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Stats */}
      <div>
        <h1 className="text-3xl font-bold">Welcome {firstName}</h1>
        <p className="text-gray-600 mt-1">Discover verified orphanages, active campaigns, and recent activities.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Stat label="Active Campaigns" value={activeCount} />
          <Stat label="Verified Orphanages" value={orphanages.length} />
          <Stat label="Recent Activities" value={reports.length} />
          <Stat label="Currency" value={"INR"} />
        </div>
      </div>

      {/* Active Campaigns */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Campaigns</h2>
          <Link to="/campaigns" className="text-primary-600 hover:underline">See all</Link>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-gray-500">No active campaigns at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="text-sm text-gray-500">{c.orphanage_name}</p>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-primary-500 rounded"
                      style={{ width: `${Math.min((c.raised_amount / (c.target_amount || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Raised ₹{c.raised_amount?.toLocaleString('en-IN') || 0}</span>
                    <span>Target ₹{c.target_amount?.toLocaleString('en-IN') || 0}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Link to={`/campaigns/${c.id}`} className="btn btn-outline">Details</Link>
                  <Link to={`/donate/${c.orphanage_id || ''}`} className="btn btn-primary">Donate</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Orphanages */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Featured Orphanages</h2>
          <Link to="/orphanages" className="text-primary-600 hover:underline">Browse all</Link>
        </div>
        {orphanages.length === 0 ? (
          <div className="text-gray-500">No verified orphanages yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {orphanages.map((o) => (
              <div key={o.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {o.logo ? (
                    <img src={o.logo} alt={o.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = '/logo.png' }} />
                  ) : (
                    <div className="text-gray-400">No Logo</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{o.name}</h3>
                  <p className="text-sm text-gray-500">{o.city}, {o.state} • Verified</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link to={`/orphanages/${o.id}`} state={{ orphanage: o }} className="btn btn-outline">View Profile</Link>
                    <Link to={`/donate/${o.id}`} className="btn btn-primary">Donate</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activities & Impact */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activities & Impact</h2>
        </div>
        {reports.length === 0 ? (
          <div className="text-gray-500">No recent verified reports yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">{r.orphanage?.name || 'Orphanage'}</div>
                <h3 className="text-lg font-semibold mt-1">{r.title}</h3>
                <p className="text-sm text-gray-600 mt-2">Utilized: ₹{(r.amount_utilized || 0).toLocaleString('en-IN')} • Beneficiaries: {r.beneficiaries_count || 0}</p>
                <div className="text-xs text-gray-500 mt-1">{new Date(r.submitted_at).toLocaleDateString()}</div>
                {r.campaign?.id && (
                  <Link to={`/campaigns/${r.campaign.id}`} className="text-primary-600 text-sm mt-3 inline-block hover:underline">View Campaign</Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
