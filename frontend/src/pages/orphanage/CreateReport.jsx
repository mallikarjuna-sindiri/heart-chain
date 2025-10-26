import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { campaignService } from '../../services/campaign'
import api from '../../services/api'

export default function CreateReport() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preselectedCampaignId = searchParams.get('campaignId') || ''
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    campaign_id: preselectedCampaignId,
    title: '',
    description: '',
    report_type: 'utilization',
    amount_utilized: '',
    beneficiaries_count: '',
    activities_conducted: '', // comma-separated
    reporting_period_start: '',
    reporting_period_end: '',
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await campaignService.getMyCampaigns()
        if (mounted) setCampaigns(data)
      } catch (e) {
        // error toast via interceptor
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.campaign_id || !form.title || !form.description || !form.amount_utilized || !form.beneficiaries_count || !form.reporting_period_start || !form.reporting_period_end) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)
    try {
      const params = {
        campaign_id: form.campaign_id,
        title: form.title,
        description: form.description,
        report_type: form.report_type,
        amount_utilized: Number(form.amount_utilized),
        beneficiaries_count: Number(form.beneficiaries_count),
        activities_conducted: form.activities_conducted
          ? form.activities_conducted.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        reporting_period_start: new Date(form.reporting_period_start).toISOString(),
        reporting_period_end: new Date(form.reporting_period_end).toISOString(),
      }
      await api.post('/reports', null, { params })
      toast.success('Report submitted successfully')
      navigate('/orphanage/dashboard')
    } catch (err) {
      // handled globally
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Upload Report Evidence</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
          <select name="campaign_id" className="input" value={form.campaign_id} onChange={handleChange} required>
            <option value="" disabled>Select a campaign…</option>
            {(campaigns || []).map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Title</label>
            <input name="title" className="input" value={form.title} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select name="report_type" className="input" value={form.report_type} onChange={handleChange}>
              <option value="utilization">utilization</option>
              <option value="progress">progress</option>
              <option value="completion">completion</option>
              <option value="quarterly">quarterly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea name="description" className="input min-h-[120px]" value={form.description} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Utilized (INR)</label>
            <input type="number" name="amount_utilized" className="input" value={form.amount_utilized} onChange={handleChange} min="0" step="1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiaries Count</label>
            <input type="number" name="beneficiaries_count" className="input" value={form.beneficiaries_count} onChange={handleChange} min="0" step="1" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Activities Conducted (comma-separated)</label>
          <input name="activities_conducted" className="input" placeholder="Purchased books, Distributed uniforms" value={form.activities_conducted} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Period Start</label>
            <input type="date" name="reporting_period_start" className="input" value={form.reporting_period_start} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Period End</label>
            <input type="date" name="reporting_period_end" className="input" value={form.reporting_period_end} onChange={handleChange} required />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
