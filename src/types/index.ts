export type Role = 'SHOPKEEPER' | 'WHOLESALER' | 'ADMIN'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export type ForecastType = 'WEEKLY' | 'MONTHLY' | 'SEASONAL' | 'FESTIVAL' | 'CUSTOM'

export type InvoiceType = 'PURCHASE' | 'SALE' | 'EXPENSE'

export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'

export type Platform = 'WEB' | 'TELEGRAM'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: Role
  businessName?: string
  businessType?: string
  gstNumber?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  latitude?: number
  longitude?: number
  profileImage?: string
  telegramChatId?: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Shop {
  id: string
  userId: string
  shopName: string
  category?: string
  createdAt: Date
  updatedAt: Date
}

export interface Wholesaler {
  id: string
  userId: string
  companyName: string
  supplyCategory: string[]
  minOrderAmount: number
  deliveryRadius: number
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string
  barcode?: string
  qrCode?: string
  category: string
  subCategory?: string
  brand?: string
  unit: string
  imageUrl?: string
  isPerishable: boolean
  shelfLife?: number
  createdAt: Date
  updatedAt: Date
}

export interface InventoryItem {
  id: string
  shopId: string
  productId: string
  quantity: number
  reorderLevel: number
  maxStock: number
  purchasePrice: number
  sellingPrice: number
  mrp?: number
  expiryDate?: Date
  batchNumber?: string
  lastRestocked?: Date
  location?: string
  product: Product
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  shopId: string
  wholesalerId: string
  status: OrderStatus
  totalAmount: number
  notes?: string
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  userId: string
  orderId?: string
  invoiceNumber: string
  type: InvoiceType
  totalAmount: number
  taxAmount: number
  discountAmount: number
  netAmount: number
  status: InvoiceStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  pdfUrl?: string
  dueDate?: Date
  createdAt: Date
}

export interface Expense {
  id: string
  userId: string
  category: string
  description?: string
  amount: number
  date: Date
  receiptUrl?: string
  recurring: boolean
  frequency?: string
  createdAt: Date
}

export interface Forecast {
  id: string
  shopId: string
  forecastType: ForecastType
  season?: string
  location?: string
  startDate: Date
  endDate: Date
  confidence: number
  generatedAt: Date
  forecastItems: ForecastItem[]
}

export interface ForecastItem {
  id: string
  forecastId: string
  productId: string
  predictedDemand: number
  suggestedOrder: number
  currentStock: number
  reasoning?: string
  product: Product
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  actionTaken?: string
  timestamp: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
}

export interface PriceComparison {
  id: string
  productId: string
  wholesalerName: string
  wholesalerId?: string
  price: number
  bulkPrice?: number
  lastChecked: Date
  source: string
}

export interface AIAction {
  type: 'UPDATE_STOCK' | 'LOG_EXPENSE' | 'CREATE_ORDER' | 'ADD_PRODUCT' | 'CREATE_CATALOG'
  data: Record<string, unknown>
}

export interface DashboardStats {
  totalProducts: number
  lowStockItems: number
  outOfStockItems: number
  totalStockValue: number
  monthlyExpenses: number
  pendingOrders: number
}
