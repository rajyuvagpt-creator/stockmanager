import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { CatalogBuilder } from '@/components/CatalogBuilder'

export default async function CatalogPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catalog & Sales</h1>
        <p className="text-gray-500 text-sm mt-1">Create product catalogs and run sales</p>
      </div>
      <CatalogBuilder />
    </div>
  )
}
