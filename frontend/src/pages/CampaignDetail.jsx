import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { campaignService } from '../services/campaign'
import { reportService } from '../services/report'

export default function CampaignDetail() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [c, reps] = await Promise.all([
          campaignService.getCampaign(id),
          reportService.getCampaignReports(id),
        ])
        if (!mounted) return
        setCampaign(c)
        setReports(reps)
      } catch (e) {
        if (mounted) setError('Failed to load campaign')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const progress = useMemo(() => {
    if (!campaign) return 0
    const pct = (campaign.raised_amount || 0) / (campaign.target_amount || 1) * 100
    return Math.min(pct, 100)
  }, [campaign])

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8">Loading campaign…</div>
  if (error) return <div className="max-w-7xl mx-auto px-4 py-8 text-red-600">{error}</div>
  if (!campaign) return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <div className="text-gray-600 mt-1">
            By <Link to={`/orphanages/${campaign.orphanage?.id}`} className="text-primary-600 hover:underline">{campaign.orphanage?.name}</Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700">{campaign.category}</span>
          <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 capitalize">{campaign.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold">About this campaign</h2>
            <p className="text-gray-700 mt-3 whitespace-pre-line">{campaign.description}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold">Recent verified reports</h2>
            {reports.length === 0 ? (
              <div className="text-gray-500 mt-2">No reports yet.</div>
            ) : (
              <div className="mt-4 space-y-4">
                {reports.map((r) => (
                  <div key={r.id} className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">{new Date(r.submitted_at).toLocaleDateString()}</div>
                        <div className="font-medium">{r.title}</div>
                      </div>
                      <span className="px-2 py-1 text-xs rounded bg-emerald-50 text-emerald-700 capitalize">{r.status}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Utilized: ₹{(r.amount_utilized || 0).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold">Donate</h2>
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-primary-500 rounded" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Raised ₹{(campaign.raised_amount || 0).toLocaleString('en-IN')}</span>
                <span>Target ₹{(campaign.target_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Link to={`/donate/${campaign.orphanage?.id}/${campaign.id}`} className="btn btn-primary w-full mt-5">
              Donate Now
            </Link>

            <div className="mt-4 text-xs text-gray-500">
              Donations are processed securely. You can view impact reports on this page.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
