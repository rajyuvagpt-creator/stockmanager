'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  ShoppingCart,
  Package,
  BarChart3,
  FileText,
  DollarSign,
  BookOpen,
  ScanLine,
  TrendingDown,
  Bot,
  LogOut,
  ChevronRight,
  Truck,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardSidebarProps {
  role: string
  userName: string
  businessName: string
}

const shopkeeperNav = [
  { href: '/shopkeeper/inventory', label: 'Inventory', icon: Package },
  { href: '/shopkeeper/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/shopkeeper/forecasts', label: 'AI Forecasts', icon: BarChart3 },
  { href: '/shopkeeper/billing', label: 'Billing', icon: FileText },
  { href: '/shopkeeper/expenses', label: 'Expenses', icon: DollarSign },
  { href: '/shopkeeper/catalog', label: 'Catalog', icon: BookOpen },
  { href: '/shopkeeper/scanner', label: 'Scanner', icon: ScanLine },
  { href: '/shopkeeper/price-compare', label: 'Price Compare', icon: TrendingDown },
  { href: '/shopkeeper/chat', label: 'AI Chat', icon: Bot },
]

const wholesalerNav = [
  { href: '/wholesaler/products', label: 'My Products', icon: Package },
  { href: '/wholesaler/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/wholesaler/billing', label: 'Billing', icon: FileText },
  { href: '/wholesaler/expenses', label: 'Expenses', icon: DollarSign },
  { href: '/wholesaler/catalog', label: 'Catalog', icon: BookOpen },
  { href: '/wholesaler/chat', label: 'AI Chat', icon: Bot },
]

export function DashboardSidebar({ role, userName, businessName }: DashboardSidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'SHOPKEEPER' ? shopkeeperNav : wholesalerNav

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-7 w-7 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">StockGenie</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          {role === 'SHOPKEEPER' ? <ShoppingCart className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
          <span>{role === 'SHOPKEEPER' ? 'Shopkeeper' : 'Wholesaler'}</span>
        </div>
      </div>

      {/* Business Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{businessName}</div>
            <div className="text-xs text-gray-500 truncate">{userName}</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
