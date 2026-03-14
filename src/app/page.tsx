import Link from 'next/link'
import { ShoppingCart, BarChart3, Bot, ScanLine, Users, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">StockGenie</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          AI-Powered Stock Management
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
          Smart Inventory for
          <span className="text-blue-600"> Kirana Shops</span>
          <br />& Wholesalers
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Manage stock with AI forecasting, barcode scanning, Telegram bot access, and complete
          billing — all in one app. Hindi, English & Hinglish support.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Start Free Today
          </Link>
          <Link
            href="/login"
            className="bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything You Need to Run Your Shop
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            अपनी दुकान को Smart बनाएं आज ही
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of shopkeepers managing inventory smarter with AI
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Register Now — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2025 StockGenie. Built for Indian shopkeepers & wholesalers.</p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'AI Demand Forecasting',
    description: 'Predict stock needs for Diwali, Holi, Eid and every season using Gemini AI + TensorFlow LSTM.',
    icon: BarChart3,
  },
  {
    title: 'Barcode & QR Scanner',
    description: 'Scan any product barcode or QR code with your phone camera. Supports EAN-13, QR, UPC, CODE-128.',
    icon: ScanLine,
  },
  {
    title: 'AI Chatbot (Web + Telegram)',
    description: 'Talk to your inventory in Hindi/English. Update stock, log expenses, create orders by chatting.',
    icon: Bot,
  },
  {
    title: 'Wholesaler Price Compare',
    description: 'Compare prices from multiple wholesalers and get AI recommendations to save money.',
    icon: ShoppingCart,
  },
  {
    title: 'Complete Accounting',
    description: 'Track all expenses, generate invoices, and get monthly tally reports automatically.',
    icon: BarChart3,
  },
  {
    title: 'Shopkeeper & Wholesaler Roles',
    description: 'Separate dashboards for shopkeepers and wholesalers with role-based access control.',
    icon: Users,
  },
]
