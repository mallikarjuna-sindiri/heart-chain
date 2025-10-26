import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/admin'
import { orphanageService } from '../../services/orphanage'
import toast from 'react-hot-toast'
import { reportService } from '../../services/report'
import { Building2, CheckCircle2, ClipboardCheck, FileCheck2, IndianRupee, Users2, Workflow, Sparkles } from 'lucide-react'

function Stat({ icon: Icon, label, value, iconBg = 'bg-indigo-50', iconColor = 'text-indigo-600' }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`${iconBg} ${iconColor} h-12 w-12 rounded-xl flex items-center justify-center`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  )
}

function Action({ to, icon: Icon, title, subtitle, badge }) {
  return (
    <Link to={to} className="card hover:shadow-md transition group">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-4 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
          <Sparkles className="h-3.5 w-3.5" /> {badge}
        </div>
      )}
    </Link>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_orphanages: 0,
    verified_orphanages: 0,
    total_campaigns: 0,
    active_campaigns: 0,
    total_donations: 0,
    total_donors: 0,
  })
  const [pending, setPending] = useState({ orphanages: 0, campaigns: 0, reports: 0 })
  const [pendingOrphanages, setPendingOrphanages] = useState([])

  const currency = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [dashboard, pendings, pendingReports, orphanagesPending] = await Promise.all([
          adminService.getDashboard(),
          adminService.getPendingVerifications(),
          reportService.getReports({ status: 'submitted' }),
          orphanageService.getOrphanages({ status: 'pending', limit: 5 }),
        ])
        if (!mounted) return
        setStats(dashboard)
        setPending({ orphanages: pendings.orphanages || 0, campaigns: pendings.campaigns || 0, reports: (pendingReports || []).length })
        setPendingOrphanages(orphanagesPending || [])
      } catch (e) {
        // errors are toasted globally
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const verify = async (id, status) => {
    try {
      await adminService.verifyOrphanage(id, { status })
      toast.success(`Orphanage ${status}`)
      // refresh counts and preview list
      const [pendings, orphanagesPending] = await Promise.all([
        adminService.getPendingVerifications(),
        orphanageService.getOrphanages({ status: 'pending', limit: 5 }),
      ])
      setPending((p) => ({ ...p, orphanages: pendings.orphanages || 0 }))
      setPendingOrphanages(orphanagesPending || [])
    } catch (e) {
      // handled globally
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Review orphanage verifications, verify reports, and handle disbursements.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat icon={Building2} label="Total Orphanages" value={loading ? '—' : stats.total_orphanages} />
        <Stat icon={CheckCircle2} label="Verified Orphanages" value={loading ? '—' : stats.verified_orphanages} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <Stat icon={Users2} label="Total Donors" value={loading ? '—' : stats.total_donors} iconBg="bg-violet-50" iconColor="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Stat icon={Workflow} label="Active Campaigns" value={loading ? '—' : stats.active_campaigns} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <Stat icon={ClipboardCheck} label="Total Campaigns" value={loading ? '—' : stats.total_campaigns} iconBg="bg-sky-50" iconColor="text-sky-600" />
        <Stat icon={IndianRupee} label="Total Donations" value={loading ? '—' : currency.format(stats.total_donations)} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Action
          to="/admin/orphanages"
          icon={Building2}
          title="Verify Orphanages"
          subtitle="Review and verify new registrations"
          badge={`${pending.orphanages} pending`}
        />
        {/* Approve Campaigns removed: orphanage campaigns are auto-published; admin verifies orphanages and reports */}
        <Action
          to="/admin/reports"
          icon={FileCheck2}
          title="Verify Reports"
          subtitle="Review utilization and progress reports"
          badge={`${pending.reports} pending`}
        />
        <Action
          to="/admin/disbursements"
          icon={IndianRupee}
          title="Fund Disbursements"
          subtitle="Release funds to verified orphanages"
        />
      </div>

      {/* Pending Orphanages Preview */}
      <div className="mt-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Orphanage Registrations</h3>
            <Link to="/admin/orphanages" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {pendingOrphanages.length === 0 && (
            <div className="text-sm text-gray-500">No pending registrations.</div>
          )}
          <div className="divide-y divide-gray-100">
            {pendingOrphanages.map((o) => (
              <div key={o.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{o.name}</p>
                  <p className="text-sm text-gray-500">{o.city}, {o.state} • Reg: {o.registration_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => verify(o.id, 'verified')} className="btn btn-sm btn-primary">Approve</button>
                  <button onClick={() => verify(o.id, 'rejected')} className="btn btn-sm btn-outline">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
