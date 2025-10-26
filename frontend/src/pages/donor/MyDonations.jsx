import { useEffect, useState } from 'react'
import { donationService } from '../../services/donation'

const StatusBadge = ({ status }) => {
  const map = {
    completed: 'bg-emerald-50 text-emerald-700',
    initiated: 'bg-amber-50 text-amber-700',
    failed: 'bg-rose-50 text-rose-700',
  }
  const cls = map[String(status).toLowerCase()] || 'bg-gray-100 text-gray-700'
  return <span className={`px-2 py-1 text-xs rounded capitalize ${cls}`}>{status}</span>
}

export default function MyDonations() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await donationService.getMyDonations()
        if (mounted) setItems(data)
      } catch (e) {
        if (mounted) setError('Failed to load donations')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">My Donations</h1>
      <p className="text-gray-600 mt-1">Your donation history and statuses.</p>

      {loading && <div className="mt-6 text-gray-500">Loading…</div>}
      {error && <div className="mt-6 text-red-600">{error}</div>}

      {!loading && !error && (
        items.length === 0 ? (
          <div className="mt-6 text-gray-500">You haven&apos;t made any donations yet.</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-t text-sm">
                    <td className="px-4 py-3">{new Date(d.transaction_date || d.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{d.campaign_title || '-'}</td>
                    <td className="px-4 py-3 font-medium">₹{(d.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
