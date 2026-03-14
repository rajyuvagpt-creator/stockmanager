import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ForecastChart } from '@/components/ForecastChart'

export default async function ForecastsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'SHOPKEEPER') redirect('/wholesaler/products')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Demand Forecasting</h1>
          <p className="text-gray-500 text-sm mt-1">Predict stock needs with AI</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Generate Forecast
        </button>
      </div>

      <ForecastChart />
    </div>
  )
}
