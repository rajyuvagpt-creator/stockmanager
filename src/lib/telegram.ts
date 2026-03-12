import { Telegraf, Context } from 'telegraf'
import { prisma } from './prisma'
import { chatWithAI } from './gemini'
import { CHATBOT_SYSTEM_PROMPT } from '@/ai/prompts/chatbot-system'

interface StockGenieContext extends Context {
  user: {
    id: string
    name: string
    role: string
    businessName: string | null
  }
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

// Auth middleware — only allow users with registered telegramChatId
bot.use(async (ctx, next) => {
  const chatId = String(ctx.from?.id)
  const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } })

  if (!user) {
    await ctx.reply(
      '🔒 Access denied.\n\nRegister at https://stockgenie.app and link your Telegram account in your profile settings.\n\nआपका खाता रजिस्टर नहीं है। StockGenie वेब पर अपना Telegram लिंक करें।'
    )
    return
  }

  ;(ctx as unknown as StockGenieContext).user = {
    id: user.id,
    name: user.name,
    role: user.role,
    businessName: user.businessName,
  }
  return next()
})

// /start
bot.command('start', async (ctx) => {
  const user = (ctx as unknown as StockGenieContext).user
  await ctx.reply(
    `🏪 Welcome to *StockGenie*, ${user.name}!\n\nCommands:\n/stock - View stock summary\n/lowstock - Low stock alerts\n/forecast - AI demand forecast\n\nOr just type your question in Hindi/English! 🤖`,
    { parse_mode: 'Markdown' }
  )
})

// /stock
bot.command('stock', async (ctx) => {
  const user = (ctx as unknown as StockGenieContext).user
  try {
    const shop = await prisma.shop.findUnique({ where: { userId: user.id } })
    if (!shop) return ctx.reply('❌ Shop not found')

    const inventory = await prisma.inventory.findMany({
      where: { shopId: shop.id },
      include: { product: true },
      orderBy: { quantity: 'asc' },
      take: 10,
    })

    if (!inventory.length) return ctx.reply('📦 No inventory found')

    const lines = inventory.map(
      (i) => `• ${i.product.name}: ${i.quantity} ${i.product.unit}`
    )
    await ctx.reply(`📦 *Stock Summary* (Top 10):\n\n${lines.join('\n')}`, {
      parse_mode: 'Markdown',
    })
  } catch {
    await ctx.reply('❌ Error fetching stock')
  }
})

// /lowstock
bot.command('lowstock', async (ctx) => {
  const user = (ctx as unknown as StockGenieContext).user
  try {
    const shop = await prisma.shop.findUnique({ where: { userId: user.id } })
    if (!shop) return ctx.reply('❌ Shop not found')

    const items = await prisma.$queryRaw<
      Array<{ name: string; quantity: number; reorderLevel: number; unit: string }>
    >`
      SELECT p.name, i.quantity, i."reorderLevel", p.unit
      FROM "Inventory" i JOIN "Product" p ON i."productId" = p.id
      WHERE i."shopId" = ${shop.id} AND i.quantity <= i."reorderLevel"
      ORDER BY i.quantity ASC
    `

    if (!items.length) return ctx.reply('✅ All stock levels are healthy!')

    const lines = items.map(
      (i) => `⚠️ ${i.name}: ${i.quantity}/${i.reorderLevel} ${i.unit}`
    )
    await ctx.reply(`🚨 *Low Stock Alert*:\n\n${lines.join('\n')}`, {
      parse_mode: 'Markdown',
    })
  } catch {
    await ctx.reply('❌ Error fetching low stock items')
  }
})

// /forecast
bot.command('forecast', async (ctx) => {
  const user = (ctx as unknown as StockGenieContext).user
  try {
    const shop = await prisma.shop.findUnique({ where: { userId: user.id } })
    if (!shop) return ctx.reply('❌ Shop not found')

    const latestForecast = await prisma.forecast.findFirst({
      where: { shopId: shop.id },
      orderBy: { generatedAt: 'desc' },
      include: { forecastItems: { include: { product: true }, take: 5 } },
    })

    if (!latestForecast) return ctx.reply('📊 No forecast available. Generate one from the web app.')

    const lines = latestForecast.forecastItems.map(
      (fi) => `• ${fi.product.name}: Order ${fi.suggestedOrder} units`
    )
    await ctx.reply(
      `📊 *Latest Forecast* (${latestForecast.forecastType}):\n\n${lines.join('\n')}\n\n_Confidence: ${(latestForecast.confidence * 100).toFixed(0)}%_`,
      { parse_mode: 'Markdown' }
    )
  } catch {
    await ctx.reply('❌ Error fetching forecast')
  }
})

// Natural language handler
bot.on('text', async (ctx) => {
  const user = (ctx as unknown as StockGenieContext).user
  const userMessage = ctx.message.text

  try {
    await ctx.sendChatAction('typing')

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
      take: 20,
    })

    const response = await chatWithAI(
      CHATBOT_SYSTEM_PROMPT,
      userMessage,
      history.map((m) => ({ role: m.role, content: m.content }))
    )

    await prisma.chatMessage.createMany({
      data: [
        { sessionId: session.id, role: 'user', content: userMessage },
        { sessionId: session.id, role: 'assistant', content: response },
      ],
    })

    await ctx.reply(response)
  } catch {
    await ctx.reply('❌ Sorry, I encountered an error. Please try again.')
  }
})

export default bot
