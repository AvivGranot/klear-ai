# Klear AI - Project Documentation

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + CSS Variables
- **Database**: Prisma + SQLite (dev) / PostgreSQL (prod)
- **UI Components**: Radix UI primitives + custom components
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI**: OpenAI API

## Commands

```bash
# Development
npm run dev          # Start dev server on port 3000

# Build
npm run build        # Generate Prisma client + build Next.js

# Production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
```

## Code Style

- **Language**: TypeScript strict mode
- **Components**: Functional components with hooks
- **Styling**: Tailwind utility classes, CSS variables for theming
- **Imports**: Absolute imports with `@/` prefix
- **State**: React hooks (useState, useEffect, useCallback)
- **Data**: Static JSON files in `/src/data/` for demo, Prisma for production
- **RTL Support**: Hebrew-first with `dir="rtl"` layout

## Project Structure

```
/src
  /app                 # Next.js App Router pages
    /dashboard         # Main dashboard pages
    /chat              # Chat interface
    /api               # API routes
  /components          # Reusable UI components
    /ui                # Base UI primitives
  /data                # Static data files (JSON)
  /hooks               # Custom React hooks
  /lib                 # Utility functions
/prisma                # Database schema
```

## Business Context

### Client: Jolika Chocolate (ג'וליקה שוקולד)
- **Website**: https://www.jolikachocolate.com/
- **Purpose**: WhatsApp bot for employee Q&A
- **Primary Managers**: שלי גולדנברג, שלי בן מויאל, רותם פרחי
- **Language**: Hebrew (RTL)

### Features
1. **Knowledge Base**: Documents, FAQs, procedures imported from WhatsApp
2. **Automation Patterns**: Repeated manager answers that can be automated
3. **Conversation Analytics**: Topic distribution, trends, insights
4. **Employee Chat**: WhatsApp-style interface for questions

### Topic Categories
- משלוחים (Deliveries)
- הזמנות (Orders)
- מלאי ופרלינים (Inventory)
- תשלומים (Payments)
- מועדון לקוחות (Loyalty)
- נהלים ותפעול (Procedures)
- אלרגנים (Allergens)
- שירות לקוחות (Customers)
- משמרות (Shifts)
- אריזות (Packaging)

## Key Files

- `/src/data/jolika-data.ts` - Core data and topic configuration
- `/src/data/all-conversations.json` - 156 parsed WhatsApp conversations
- `/src/data/whatsapp-faqs.json` - FAQ patterns from managers
- `/src/app/dashboard/page.tsx` - Main dashboard
- `/src/app/dashboard/knowledge/page.tsx` - Knowledge management
- `/src/app/dashboard/analytics/page.tsx` - Analytics and charts
- `/src/app/dashboard/conversations/page.tsx` - Conversation history
