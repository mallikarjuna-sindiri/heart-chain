import { useEffect, useMemo, useState } from 'react'
import { orphanageService } from '../../services/orphanage'

export default function PayoutHistory() {
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState([])
  const currency = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await orphanageService.getMyPayouts()
        if (mounted) setPayouts(data)
      } catch (e) {
        // errors handled by interceptor
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Platform Payout History</h1>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Transaction ID</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Method</th>
                <th className="py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {!loading && payouts.length === 0 && (
                <tr>
                  <td className="py-6 text-gray-500" colSpan={6}>No payouts yet.</td>
                </tr>
              )}
              {payouts.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">{new Date(p.transaction_date).toLocaleString()}</td>
                  <td className="py-3 pr-4">{p.transaction_id}</td>
                  <td className="py-3 pr-4 font-medium">{currency.format(p.amount || 0)}</td>
                  <td className="py-3 pr-4"><span className="badge badge-info">{p.status}</span></td>
                  <td className="py-3 pr-4">{p.method || '-'}</td>
                  <td className="py-3">{p.reference || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
