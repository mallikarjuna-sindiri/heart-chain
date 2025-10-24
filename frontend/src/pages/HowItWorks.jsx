function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">How It Works</h1>
        <p className="text-gray-600 mt-2">A quick overview of how donations are processed and tracked.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">1. Find an Orphanage</h3>
            <p className="text-gray-600">Browse verified organizations and choose an orphanage or program to support.</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">2. Donate Securely</h3>
          <p className="text-gray-600">Payments are processed through secure providers with zero platform fees.</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">3. Track Impact</h3>
          <p className="text-gray-600">Orphanages post reports and receipts so donors can see exactly how funds were used.</p>
        </div>
      </div>
    </div>
  )
}

export default HowItWorksPage
