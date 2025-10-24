import { Link } from 'react-router-dom'

export default function DonorDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Verified Orphanages</h1>
        <p className="text-gray-600">Orphanages you can support — view profiles or donate directly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('/images/orphanage-${i % 3 + 1}.jpg')` }} />
            <div className="p-4">
              <h3 className="text-lg font-semibold">Orphanage {i}</h3>
              <p className="text-sm text-gray-500">Location • Verified</p>
              <div className="mt-4 flex items-center justify-between">
                <Link to={`/orphanages/${i}`} className="btn btn-outline">View Profile</Link>
                <Link to={`/donate/${i}`} className="btn btn-primary">Donate</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
