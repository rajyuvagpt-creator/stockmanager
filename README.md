# 🏪 StockGenie — AI-Powered Shop Stock Management

> Smart inventory management for Kirana shops, grocery stores, and wholesalers — powered by AI, deep learning, and real-time insights.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Telegram Bot Setup](#telegram-bot-setup)
- [ML Service Setup](#ml-service-setup)
- [Deployment](#deployment)

---

## Overview

StockGenie is a full-stack web application designed for Indian shopkeepers and wholesalers to manage their inventory intelligently. It uses Google Gemini AI + TensorFlow.js for demand forecasting, supports barcode/QR scanning, Telegram bot integration, and includes complete billing with Razorpay.

**Supports: Hindi 🇮🇳 | English 🇬🇧 | Hinglish 🤝**

---

## Features

### 🏪 For Shopkeepers
- **Smart Inventory Management** — Track stock, set reorder levels, manage batches and expiry dates
- **AI Demand Forecasting** — Predict demand for Diwali, Holi, Eid, seasonal changes using Gemini + LSTM
- **Barcode & QR Scanner** — Camera-based scanning (EAN-13, EAN-8, QR, UPC, CODE-128, CODE-39)
- **Wholesale Price Comparison** — Compare prices from multiple wholesalers with AI analysis
- **Order Management** — Create and track orders from wholesalers
- **AI Chatbot** — Update stock, log expenses, create orders by chatting in Hindi/English
- **Telegram Bot** — Access your shop on Telegram with same AI capabilities
- **Expense Tracking** — Monthly expense categorization with visual charts
- **Billing & Invoicing** — Generate invoices with Razorpay payment integration
- **Catalog Management** — Create product catalogs and run sales

### 🚛 For Wholesalers
- **Product Catalog** — Manage products with bulk pricing
- **Order Management** — Receive and fulfill orders from shopkeepers
- **AI Chatbot** — Natural language business management
- **Expense Tracking** — Business expense management
- **Billing** — Invoice generation and payment tracking

### 🤖 AI Features
- **Gemini AI Chatbot** — Parses natural language, executes inventory/expense actions
- **TensorFlow.js LSTM** — Deep learning demand forecasting model
- **Seasonal Analysis** — Indian festivals and season-aware predictions
- **Location-Based Demand** — Region-specific product preferences
- **Image Recognition** — Product info extraction from photos
- **NLP Stock Updates** — "Chawal 50 kg add karo" style commands

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | NextAuth.js v4 with JWT sessions |
| **AI/LLM** | Google Gemini API (`gemini-1.5-flash`, `gemini-1.5-pro`) |
| **Deep Learning** | TensorFlow.js (LSTM demand forecasting) |
| **Cache** | Upstash Redis (sessions, rate limiting) |
| **Payments** | Razorpay (orders + webhooks) |
| **Images** | Cloudinary (product photos) |
| **Bot** | Telegraf.js (Telegram bot) |
| **ML Service** | FastAPI + Prophet (Python) |
| **Charts** | Recharts |
| **Icons** | Lucide React |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  Next.js App (React) + Tailwind CSS + Recharts              │
│  Components: BarcodeScanner, ChatWindow, ForecastChart...   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/API
┌─────────────────────▼───────────────────────────────────────┐
│                     Next.js API Routes                       │
│  /api/inventory  /api/chat  /api/forecasts  /api/billing    │
│  /api/auth  /api/orders  /api/expenses  /api/catalog        │
└──────┬──────────────┬─────────────────┬────────────────┬────┘
       │              │                 │                │
┌──────▼──────┐ ┌─────▼──────┐ ┌───────▼──────┐ ┌──────▼────┐
│  PostgreSQL  │ │ Gemini AI  │ │  Razorpay    │ │ Cloudinary│
│  (Prisma)   │ │  API       │ │  Payments    │ │  Images   │
└─────────────┘ └────────────┘ └──────────────┘ └───────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│                    External Services                         │
│  Upstash Redis (cache)  │  Telegram Bot (Telegraf.js)       │
│  Python ML Service (FastAPI + Prophet)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
stockgenie/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx        # Login page
│   │   │   └── register/page.tsx     # Registration with role selection
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   ├── shopkeeper/
│   │   │   │   ├── inventory/        # Stock management
│   │   │   │   ├── orders/           # Order management
│   │   │   │   ├── forecasts/        # AI forecasting
│   │   │   │   ├── billing/          # Invoices & payments
│   │   │   │   ├── expenses/         # Expense tracking
│   │   │   │   ├── catalog/          # Product catalogs
│   │   │   │   ├── scanner/          # Barcode scanner
│   │   │   │   ├── price-compare/    # Wholesale price comparison
│   │   │   │   └── chat/             # AI chatbot
│   │   │   └── wholesaler/
│   │   │       ├── products/         # Product management
│   │   │       ├── orders/           # Order fulfillment
│   │   │       ├── billing/          # Invoices
│   │   │       ├── expenses/         # Expense tracking
│   │   │       ├── catalog/          # Catalogs
│   │   │       └── chat/             # AI chatbot
│   │   ├── api/                      # API routes
│   │   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   │   ├── auth/register/        # User registration
│   │   │   ├── inventory/            # Inventory CRUD + scan
│   │   │   ├── products/             # Product CRUD + upload
│   │   │   ├── orders/               # Order management
│   │   │   ├── forecasts/            # Forecast CRUD + generate
│   │   │   ├── price-compare/        # Price comparison
│   │   │   ├── billing/              # Invoices + Razorpay
│   │   │   ├── expenses/             # Expense CRUD
│   │   │   ├── catalog/              # Catalog management
│   │   │   ├── chat/                 # AI chat endpoint
│   │   │   └── telegram/webhook/     # Telegram webhook
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── auth.ts                   # NextAuth configuration
│   │   ├── gemini.ts                 # Google Gemini AI client
│   │   ├── razorpay.ts               # Razorpay client
│   │   ├── telegram.ts               # Telegraf bot
│   │   ├── cloudinary.ts             # Cloudinary client
│   │   ├── redis.ts                  # Upstash Redis client
│   │   └── utils.ts                  # Utility functions
│   ├── ai/
│   │   ├── prompts/                  # AI prompts
│   │   ├── forecast/                 # ML models
│   │   └── actions/                  # AI-triggered DB actions
│   ├── components/                   # React components
│   ├── hooks/                        # Custom React hooks
│   └── types/index.ts                # TypeScript types
├── prisma/schema.prisma              # Database schema
├── telegram-bot/                     # Standalone bot
├── ml-service/                       # Python ML service
├── .env.example                      # Environment template
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or Supabase/Neon)
- Google Gemini API key

### 1. Clone & Install

```bash
git clone https://github.com/rajyuvagpt-creator/stockmanager.git
cd stockmanager
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Database Setup

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random 32+ char secret for JWT |
| `NEXTAUTH_URL` | ✅ | App URL (http://localhost:3000 in dev) |
| `GOOGLE_GEMINI_API_KEY` | ✅ | From [Google AI Studio](https://aistudio.google.com/) |
| `RAZORPAY_KEY_ID` | For billing | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | For billing | Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME` | For images | Cloudinary dashboard |
| `TELEGRAM_BOT_TOKEN` | For bot | [@BotFather](https://t.me/BotFather) |
| `UPSTASH_REDIS_REST_URL` | For caching | [Upstash](https://console.upstash.com/) |

---

## Database Setup

### Using Supabase (Recommended for free tier)

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Project Settings → Database → URI
3. Set `DATABASE_URL` in `.env`

### Commands

```bash
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:push       # Push schema (no migration history)
npm run db:migrate    # Create and run migrations (production)
npm run db:studio     # Open Prisma Studio (visual DB editor)
```

---

## API Reference

### Auth
- `POST /api/auth/register` — Register user (role: SHOPKEEPER | WHOLESALER)
- NextAuth endpoints at `/api/auth/*`

### Inventory
- `GET /api/inventory` — List items (`?lowStock=true` for alerts)
- `POST /api/inventory` — Add item
- `PUT /api/inventory` — Update item
- `DELETE /api/inventory?id=` — Delete item
- `GET /api/inventory/scan?barcode=` — Barcode lookup

### AI Features
- `POST /api/chat` — Chat with AI (`{ message, sessionId? }`)
- `POST /api/forecasts/generate` — Generate forecast
- `GET /api/forecasts` — List forecasts
- `POST /api/price-compare` — Compare prices with AI analysis

### Billing
- `GET/POST /api/billing` — Invoices
- `POST /api/billing/razorpay/order` — Create payment order
- `POST /api/billing/razorpay/verify` — Verify payment

---

## Telegram Bot Setup

### 1. Create Bot via BotFather
```
/newbot → Follow instructions → Copy token
```

### 2. Set Webhook (Production)
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook"
```

### 3. Standalone Mode (Development)
```bash
cd telegram-bot
npm install
npm start
```

### 4. Link Account
Users link their Telegram to StockGenie via Profile Settings in the web app.

---

## ML Service Setup (Optional)

Enhanced Prophet-based forecasting:

```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set `ML_SERVICE_URL=http://localhost:8000` in `.env`

---

## Deployment

### Vercel
```bash
npx vercel --prod
```
Add all env vars in Vercel dashboard. For DB migrations:
```bash
npx prisma migrate deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

Built with ❤️ for Indian shopkeepers and wholesalers 🇮🇳