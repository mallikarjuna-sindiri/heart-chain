import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  'education',
  'food',
  'medical',
  'infrastructure',
  'clothing',
  'emergency',
  'other',
]

export default function CreateCampaign() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'education',
    target_amount: '',
    end_date: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.category || !form.target_amount) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)
    try {
      const params = {
        title: form.title,
        description: form.description,
        category: form.category,
        target_amount: Number(form.target_amount),
      }
      if (form.end_date) {
        params.end_date = new Date(form.end_date).toISOString()
      }
      await api.post('/campaigns', null, { params })
      toast.success('Campaign created successfully')
      navigate('/orphanage/dashboard')
    } catch (err) {
      // Error toast handled globally; keep UX responsive here
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Orphanage Campaign</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input name="title" className="input" value={form.title} onChange={handleChange} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea name="description" className="input min-h-[120px]" value={form.description} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select name="category" className="input" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (INR)</label>
            <input name="target_amount" type="number" className="input" value={form.target_amount} onChange={handleChange} min="0" step="1" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date (optional)</label>
          <input name="end_date" type="date" className="input" value={form.end_date} onChange={handleChange} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Campaign'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
