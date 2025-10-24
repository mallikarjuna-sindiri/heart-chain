/**
 * Profile Page (all roles)
 * - Update name and phone
 * - Upload profile image
 */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { userService } from '../services/user'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser, setUser } = useAuthStore()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [avatar, setAvatar] = useState(user?.profile_image || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const u = await userService.getProfile()
        if (!mounted) return
        setForm({ full_name: u.full_name || '', phone: u.phone || '' })
        setAvatar(u.profile_image || '')
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

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
