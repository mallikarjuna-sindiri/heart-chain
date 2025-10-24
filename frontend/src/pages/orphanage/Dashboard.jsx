import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import {
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Plus,
  Clock,
  Upload,
  LineChart,
} from 'lucide-react'
import { orphanageService } from '../../services/orphanage'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, title, value, subtitle, iconBg = 'bg-amber-50', iconColor = 'text-amber-600' }) {
  return (
    <div className="card flex gap-4 items-start">
      <div className={`${iconBg} ${iconColor} h-12 w-12 rounded-xl flex items-center justify-center`}> 
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function ProgressBar({ percent }) {
  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-amber-100">
        <div
          className="h-2 rounded-full bg-amber-500 transition-all"
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function OrphanageDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('projects')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ stats: {}, projects: [], recent_donations: [], documents: [], orphanage: null })

  const currency = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await orphanageService.getMySummary()
        if (mounted) setSummary(data)
      } catch (e) {
        // error toast handled globally in api interceptor
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const status = String(summary.orphanage?.status || '').toLowerCase()
  const statusBadge = () => {
    if (status === 'verified') return <span className="badge badge-success">Verified</span>
    if (status === 'rejected') return <span className="badge badge-error">Rejected</span>
    if (status === 'suspended') return <span className="badge badge-warning">Suspended</span>
    return <span className="badge">Pending Verification</span>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orphanage Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              {(summary.orphanage?.name || user?.full_name || 'Your Orphanage')} - Manage your funding goals and track donations
            </p>
          </div>
          <div className="mt-1">{statusBadge()}</div>
        </div>
        {status !== 'verified' && (
          <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            Your organization is awaiting admin verification. You can create campaigns but they will not be public until verification is complete.
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={IndianRupee}
          title="Current Available Balance"
          value={loading ? '—' : currency.format(summary.stats?.available_balance || 0)}
          subtitle="Ready for withdrawal"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          title="Active Campaign Progress"
          value={loading ? '—' : `${summary.stats?.average_progress ?? 0}%`}
          subtitle="Average across all projects"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          icon={AlertTriangle}
          title="Unreported Funds"
          value={loading ? '—' : currency.format(summary.stats?.unreported_funds || 0)}
          subtitle="Requires utilization report"
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <button className="btn btn-primary flex items-center justify-center gap-2 py-3" onClick={() => navigate('/orphanage/campaigns/create')}>
          <Plus className="h-5 w-5" /> Create New Funding Goal
        </button>
        <button className="btn btn-outline flex items-center justify-center gap-2 py-3" onClick={() => navigate('/orphanage/payouts')}>
          <Clock className="h-5 w-5" /> View Platform Payout History
        </button>
        <button className="btn btn-outline flex items-center justify-center gap-2 py-3" onClick={() => navigate('/orphanage/reports/create')}>
          <Upload className="h-5 w-5" /> Upload Report Evidence
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="flex items-center gap-2 text-sm">
          {[
            { key: 'projects', label: 'Active Projects' },
            { key: 'donations', label: 'Recent Donations' },
            { key: 'documents', label: 'Reports & Documents' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-md border text-gray-700 hover:text-gray-900 transition ${
                activeTab === t.key ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {(summary.projects || []).map((p) => {
                const remaining = Math.max((p.target_amount || 0) - (p.raised_amount || 0), 0)
                return (
                  <div key={p.id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{p.total_donors || 0} donors supporting this project</p>
                      </div>
                      <button className="btn btn-outline flex items-center gap-2" onClick={() => navigate(`/orphanage/reports/create?campaignId=${p.id}`)}>
                        <Upload className="h-4 w-4" /> Update Report
                      </button>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-amber-700 mb-2">{Math.round(p.percent || 0)}% Funded</p>
                      <ProgressBar percent={p.percent || 0} />
                      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <LineChart className="h-4 w-4" />
                          <span>{currency.format(remaining)} remaining</span>
                        </div>
                        <div className="text-right text-gray-500">
                          {currency.format(p.raised_amount || 0)} of {currency.format(p.target_amount || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'donations' && (
            <div className="card">
              <ul className="divide-y divide-gray-100">
                {(summary.recent_donations || []).map((d) => (
                  <li key={d.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{d.donor_name}</p>
                      <p className="text-sm text-gray-500">{new Date(d.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right font-semibold text-gray-900">{currency.format(d.amount || 0)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="card">
              <ul className="divide-y divide-gray-100">
                {(summary.documents || []).map((doc) => (
                  <li key={doc.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{doc.title}</p>
                      <p className="text-sm text-gray-500">{new Date(doc.submitted_at).toLocaleDateString()}</p>
                    </div>
                    <span className="badge badge-info">{doc.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
