/**
 * Profile Page (all roles)
 * - Update name and phone
 * - Upload profile image
 */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { userService } from '../services/user'
import { orphanageService } from '../services/orphanage'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser, setUser } = useAuthStore()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [avatar, setAvatar] = useState(user?.profile_image || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Orphanage-specific state
  const isOrphanage = user?.role === 'orphanage'
  const [org, setOrg] = useState(null)
  const [orgForm, setOrgForm] = useState({
    id: '',
    name: '',
    registration_number: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    capacity: '',
    current_occupancy: '',
    established_year: '',
    logo: '',
  })
  const [savingOrg, setSavingOrg] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const u = await userService.getProfile()
        if (!mounted) return
        setForm({ full_name: u.full_name || '', phone: u.phone || '' })
        setAvatar(u.profile_image || '')

        // If orphanage, load org details
        if (u.role === 'orphanage') {
          try {
            const my = await orphanageService.getMyOrphanage()
            if (!mounted) return
            setOrg(my)
            setOrgForm({
              id: my.id,
              name: my.name || '',
              registration_number: my.registration_number || '',
              description: my.description || '',
              email: my.email || '',
              phone: my.phone || '',
              website: my.website || '',
              address: my.address || '',
              city: my.city || '',
              state: my.state || '',
              pincode: my.pincode || '',
              capacity: String(my.capacity ?? ''),
              current_occupancy: String(my.current_occupancy ?? ''),
              established_year: String(my.established_year ?? ''),
              logo: my.logo || '',
            })
          } catch (e) {
            // If no orphanage exists yet, ignore
          }
        }
      } catch (e) {
        // handled globally
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSave = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await userService.updateProfile(form)
      await refreshUser()
      toast.success('Profile updated')
    } catch (e) {
      // global toast
    } finally {
      setSaving(false)
    }
  }

  const onAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url } = await userService.uploadProfileImage(file)
      setAvatar(url)
      // reflect change locally too
      await refreshUser()
      toast.success('Profile image updated')
    } catch (e) {
      // global toast
    }
  }

  const onOrgChange = (e) => {
    const { name, value } = e.target
    setOrgForm((prev) => ({ ...prev, [name]: value }))
  }

  const onOrgLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await orphanageService.uploadLogo(file)
      if (!url) return
      setOrgForm((prev) => ({ ...prev, logo: url }))
      toast.success('Logo uploaded')
    } catch (err) {
      // global toast will show error
    }
  }

  const onSaveOrg = async (e) => {
    e.preventDefault()
    if (!orgForm.id) return
    if (savingOrg) return
    setSavingOrg(true)
    try {
      const payload = {
        name: orgForm.name,
        description: orgForm.description,
        phone: orgForm.phone,
        website: orgForm.website || null,
        address: orgForm.address,
        city: orgForm.city,
        state: orgForm.state,
        pincode: orgForm.pincode,
        capacity: orgForm.capacity ? Number(orgForm.capacity) : undefined,
        current_occupancy: orgForm.current_occupancy ? Number(orgForm.current_occupancy) : undefined,
        logo: orgForm.logo || undefined,
      }
      const updated = await orphanageService.updateOrphanage(orgForm.id, payload)
      setOrg(updated)
      toast.success('Organization details updated')
    } catch (err) {
      // global toast
    } finally {
      setSavingOrg(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8">Loading profile…</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
      <p className="text-gray-600 mt-1">Update your personal details</p>

      <div className="card mt-6">
        <form onSubmit={onSave} className="space-y-6">
          <div className="flex items-center gap-6">
            <div>
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = '/logo.png' }} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Change Profile Image</label>
              <input type="file" accept="image/*" onChange={onAvatar} />
              <p className="text-xs text-gray-500 mt-1">JPG/PNG recommended.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input name="full_name" className="input" value={form.full_name} onChange={onChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input name="phone" type="tel" className="input" value={form.phone} onChange={onChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input value={user?.email || ''} className="input bg-gray-100" disabled readOnly />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {isOrphanage && (
        <div className="card mt-8">
          <h2 className="text-xl font-semibold text-gray-900">Organization Details</h2>
          <p className="text-gray-600 mt-1">Edit information you provided during registration</p>
          {org ? (
            <form onSubmit={onSaveOrg} className="space-y-6 mt-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="h-20 w-20 rounded bg-gray-100 overflow-hidden">
                    {orgForm.logo ? (
                      <img src={orgForm.logo} alt="Logo" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = '/logo.png' }} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">No Logo</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Change Logo</label>
                  <input type="file" accept="image/*" onChange={onOrgLogo} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                  <input name="name" className="input" value={orgForm.name} onChange={onOrgChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                  <input value={orgForm.registration_number} className="input bg-gray-100" disabled readOnly />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea name="description" className="input" rows={3} value={orgForm.description} onChange={onOrgChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input name="phone" className="input" value={orgForm.phone} onChange={onOrgChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input name="website" className="input" value={orgForm.website} onChange={onOrgChange} placeholder="https://" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input name="address" className="input" value={orgForm.address} onChange={onOrgChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input name="city" className="input" value={orgForm.city} onChange={onOrgChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input name="state" className="input" value={orgForm.state} onChange={onOrgChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input name="pincode" className="input" value={orgForm.pincode} onChange={onOrgChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <input name="capacity" type="number" className="input" value={orgForm.capacity} onChange={onOrgChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Occupancy</label>
                  <input name="current_occupancy" type="number" className="input" value={orgForm.current_occupancy} onChange={onOrgChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email (Registration)</label>
                  <input value={orgForm.email} className="input bg-gray-100" disabled readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
                  <input value={orgForm.established_year} className="input bg-gray-100" disabled readOnly />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingOrg}>
                {savingOrg ? 'Saving…' : 'Save Organization'}
              </button>
            </form>
          ) : (
            <div className="mt-4 text-gray-600">No organization profile found. You can register your orphanage from the dashboard.</div>
          )}
        </div>
      )}
    </div>
  )
}
