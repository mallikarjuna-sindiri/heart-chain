import { useEffect, useState } from 'react'
import { orphanageService } from '../../services/orphanage'
import { adminService } from '../../services/admin'
import { CheckCircle2, XCircle, MapPin, Mail, Phone, RefreshCcw } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'all', label: 'All' },
]

export default function ManageOrphanages() {
  const [tab, setTab] = useState('pending')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async (statusKey = tab) => {
    setLoading(true)
    setError(null)
    try {
      const params = statusKey === 'all' ? {} : { status: statusKey }
      const data = await orphanageService.getOrphanages(params)
      setItems(data)
    } catch (e) {
      setError('Failed to load orphanages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('pending')
  }, [])

  useEffect(() => {
    load(tab)
  }, [tab])

  const verify = async (id, status) => {
    try {
      let rejection_reason
      if (status === 'rejected') {
        rejection_reason = window.prompt('Enter rejection reason (optional):') || null
      }
      await adminService.verifyOrphanage(id, { status, rejection_reason })
      toast.success(`Orphanage ${status} successfully`)
      load(tab)
    } catch (e) {
      // Error toasts handled globally
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Orphanages</h1>
          <p className="text-gray-600">Review registrations and approve only real/valid organizations.</p>
        </div>
        <button onClick={() => load()} className="btn btn-outline flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm mb-4">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md border ${tab === t.key ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200 text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-gray-500">Loading orphanages…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {items.length === 0 && (
            <div className="card text-center text-gray-500">No orphanages in this status.</div>
          )}

          {items.map((o) => (
            <div key={o.id} className="card">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{o.name}</h3>
                  <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {o.city}, {o.state}</span>
                    <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {o.email}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {o.phone}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Reg No: <span className="font-mono">{o.registration_number}</span> • Capacity: {o.capacity} • Occupancy: {o.current_occupancy}
                  </div>
                  {o.website && (
                    <div className="mt-1 text-xs"><a className="text-primary-600 hover:underline" href={o.website} target="_blank" rel="noreferrer">{o.website}</a></div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {(tab === 'pending' || tab === 'rejected' || tab === 'suspended') && (
                    <button onClick={() => verify(o.id, 'verified')} className="btn btn-primary flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                  )}
                  {(tab === 'pending' || tab === 'verified') && (
                    <button onClick={() => verify(o.id, 'rejected')} className="btn btn-outline flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
