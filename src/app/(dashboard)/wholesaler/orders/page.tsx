import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function WholesalerOrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'WHOLESALER') redirect('/shopkeeper/orders')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Received Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Manage orders from shopkeepers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No orders received yet</p>
          <p className="text-sm mt-1">Orders from shopkeepers will appear here</p>
        </div>
      </div>
    </div>
  )
}
