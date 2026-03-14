#!/usr/bin/env node
/**
 * Standalone Telegram Bot Server
 * Run: npx tsx telegram-bot/index.ts
 * 
 * Or set webhook via Telegram Bot API:
 * POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEBHOOK_URL>
 */

import { config } from 'dotenv'
config({ path: '../.env' })

import { Telegraf, Context } from 'telegraf'
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const prisma = new PrismaClient()
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

// ── Middleware: Auth ──────────────────────────────────────────────────────────
bot.use(async (ctx: Context, next) => {
  const chatId = String(ctx.from?.id)

  const user = await prisma.user.findUnique({
    where: { telegramChatId: chatId },
    include: { shop: true, wholesaler: true },
  })

  if (!user) {
    await ctx.reply(
      '🔒 Access Denied\n\nYou need to link your Telegram account first.\n\n1. Register at https://stockgenie.app\n2. Go to Profile Settings\n3. Enter your Telegram Chat ID: ' + chatId
    )
    return
  }

  ;(ctx as Context & { stockGenieUser: typeof user }).stockGenieUser = user
  return next()
})

// ── /start ───────────────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const user = (ctx as Context & { stockGenieUser: { name: string; role: string } }).stockGenieUser
  await ctx.reply(
    `🏪 *Welcome to StockGenie!*\n\n` +
    `Hello ${user.name}! (${user.role})\n\n` +
    `*Available Commands:*\n` +
    `/stock — View stock summary\n` +
    `/lowstock — Low stock alerts\n` +
    `/forecast — Latest AI forecast\n` +
    `/expenses — Monthly expense summary\n` +
    `/orders — Recent orders\n` +
    `/help — Show this menu\n\n` +
    `Or just type your question in Hindi or English! 🤖`,
    { parse_mode: 'Markdown' }
  )
})

// ── /help ─────────────────────────────────────────────────────────────────────
bot.command('help', async (ctx) => {
  await ctx.reply(
    `*StockGenie Bot Commands:*\n\n` +
    `/stock — View all stock\n` +
    `/lowstock — Items below reorder level\n` +
    `/forecast — AI demand forecast\n` +
    `/expenses — Monthly expenses\n` +
    `/orders — Order status\n\n` +
    `You can also chat naturally:\n` +
    `• "Chawal 50 kg add karo"\n` +
    `• "Aaj 500 rs electricity bill"\n` +
    `• "Low stock kya hai?"\n` +
    `• "Diwali ke liye kya order karein?"`,
    { parse_mode: 'Markdown' }
  )
})

// ── /stock ────────────────────────────────────────────────────────────────────
bot.command('stock', async (ctx) => {
  const user = (ctx as Context & { stockGenieUser: { id: string; role: string; shop?: { id: string } } }).stockGenieUser
  
  if (user.role !== 'SHOPKEEPER' || !user.shop) {
    return ctx.reply('This command is only for shopkeepers.')
  }

  const inventory = await prisma.inventory.findMany({
    where: { shopId: user.shop.id },
    include: { product: true },
    orderBy: { quantity: 'asc' },
    take: 15,
  })

  if (!inventory.length) return ctx.reply('📦 No inventory found. Add products via web app.')

  const lines = inventory.map(
    (i) => `• ${i.product.name}: *${i.quantity}* ${i.product.unit} (₹${i.sellingPrice})`
  )

  await ctx.reply(
    `📦 *Stock Summary* (${inventory.length} items)\n\n${lines.join('\n')}`,
    { parse_mode: 'Markdown' }
  )
})

// ── /lowstock ─────────────────────────────────────────────────────────────────
bot.command('lowstock', async (ctx) => {
  const user = (ctx as Context & { stockGenieUser: { id: string; role: string; shop?: { id: string } } }).stockGenieUser

  if (user.role !== 'SHOPKEEPER' || !user.shop) {
    return ctx.reply('This command is only for shopkeepers.')
  }

  const items = await prisma.$queryRaw<Array<{ name: string; quantity: number; reorderLevel: number; unit: string }>>`
    SELECT p.name, i.quantity, i."reorderLevel", p.unit
    FROM "Inventory" i JOIN "Product" p ON i."productId" = p.id
    WHERE i."shopId" = ${user.shop.id} AND i.quantity <= i."reorderLevel"
    ORDER BY i.quantity ASC
  `

  if (!items.length) return ctx.reply('✅ All stock levels are healthy!')

  const lines = items.map(
    (i) => `⚠️ *${i.name}*: ${i.quantity}/${i.reorderLevel} ${i.unit}`
  )

  await ctx.reply(
    `🚨 *Low Stock Alert* (${items.length} items):\n\n${lines.join('\n')}\n\n_Order these soon!_`,
    { parse_mode: 'Markdown' }
  )
})

// ── /forecast ─────────────────────────────────────────────────────────────────
bot.command('forecast', async (ctx) => {
  const user = (ctx as Context & { stockGenieUser: { id: string; role: string; shop?: { id: string } } }).stockGenieUser

  if (user.role !== 'SHOPKEEPER' || !user.shop) {
    return ctx.reply('This command is only for shopkeepers.')
  }

  const forecast = await prisma.forecast.findFirst({
    where: { shopId: user.shop.id },
    orderBy: { generatedAt: 'desc' },
    include: { forecastItems: { include: { product: true }, take: 8 } },
  })

  if (!forecast) {
    return ctx.reply('📊 No forecast yet. Generate one from the StockGenie web app.')
  }

  const lines = forecast.forecastItems.map(
    (fi) => `• ${fi.product.name}: Order *${fi.suggestedOrder}* units\n  _${fi.reasoning || 'Based on demand analysis'}_`
  )

  await ctx.reply(
    `📊 *${forecast.forecastType} Forecast*\n` +
    `Season: ${forecast.season || 'General'}\n` +
    `Confidence: ${(forecast.confidence * 100).toFixed(0)}%\n\n` +
    lines.join('\n'),
    { parse_mode: 'Markdown' }
  )
})

// ── /expenses ─────────────────────────────────────────────────────────────────
bot.command('expenses', async (ctx) => {
  const user = (ctx as Context & { stockGenieUser: { id: string } }).stockGenieUser

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id, date: { gte: startOfMonth } },
    orderBy: { date: 'desc' },
    take: 10,
  })

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (!expenses.length) return ctx.reply('💰 No expenses this month.')

  const lines = expenses.map(
    (e) => `• ${e.category}: ₹${e.amount}${e.description ? ` (${e.description})` : ''}`
  )

  await ctx.reply(
    `💰 *This Month's Expenses*\n\n${lines.join('\n')}\n\n*Total: ₹${total.toFixed(2)}*`,
    { parse_mode: 'Markdown' }
  )
})

// ── Natural Language Handler ──────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const user = (ctx as Context & { stockGenieUser: { id: string; name: string } }).stockGenieUser
  const text = ctx.message.text

  await ctx.sendChatAction('typing')

  try {
    let session = await prisma.chatSession.findFirst({
      where: { userId: user.id, platform: 'TELEGRAM', endedAt: null },
      orderBy: { startedAt: 'desc' },
    })

    if (!session) {
      session = await prisma.chatSession.create({
        data: { userId: user.id, platform: 'TELEGRAM' },
      })
    }

    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { timestamp: 'asc' },
      take: 10,
    })

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const chat = model.startChat({
      history: history.map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
    })

    const result = await chat.sendMessage(text)
    const response = result.response.text()

    await prisma.chatMessage.createMany({
      data: [
        { sessionId: session.id, role: 'user', content: text },
        { sessionId: session.id, role: 'assistant', content: response },
      ],
    })

    await ctx.reply(response)
  } catch {
    await ctx.reply('❌ Error processing your request. Please try again.')
  }
})

// ── Start Bot ─────────────────────────────────────────────────────────────────
bot.launch()
  .then(() => console.log('🤖 StockGenie Telegram Bot started!'))
  .catch(console.error)

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
