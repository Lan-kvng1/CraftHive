# 👑 CraftHive Administrative Dashboard

> **Dark Luxury Administration System for CraftHive Artisan Marketplace**  
> Built with Next.js (App Router), TypeScript, Supabase, and Tailwind / Custom CSS design system.

---

## 🌟 Features Overview

- **📊 Live Dashboard & Analytics**: Dynamic metrics cards, daily revenue volume, active bookings, KYC queue counters, and activity audit stream.
- **🛡️ KYC Verification Portal**: National ID and certification document inspector modal with high-res zoom, status filters, and instant approve/reject workflow with customizable feedback notes.
- **🔨 Artisan Directory & Approval**: Detailed profile inspection, trade category filters, portfolio gallery, verification badge assignment, and account status management (Active, Suspended, Pending).
- **👥 Customer & User Management**: User table, account role inspection, booking count tracking, contact details, and user status toggles.
- **📅 Bookings Management**: End-to-end booking timeline monitoring, ticket ID tracking, customer/artisan matching, and cancellation controls.
- **💳 Escrow & Financial Management**: Payments tracking, automated commission calculation (10%), artisan payout releases, and dispute resolution module.
- **📈 Reports & CSV Data Export**: One-click CSV export across all datasets (Users, Artisans, Bookings, Transactions, Disputes).
- **⚙️ Admin & Profile Settings**: Admin profile picture uploads (`avatar_url`), security credentials update, and admin team account management.

---

## 🚀 Technical Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript
- **Database & Storage**: Supabase (PostgreSQL, Realtime, Storage buckets `avatars` and `portfolios`)
- **Charts & Visualization**: Recharts
- **Icons & Aesthetic**: Custom SVG Icon system (`Ico`), Dark Luxury theme palette (`#1B2B6B`, `#FFB800`, `#0F172A`)
- **Notifications**: Toast notification provider

---

## 🛠️ Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

---

## ⚡ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 🔒 Security & RBAC

All administrative operations utilize Supabase Service Role and Admin Profiles verification to enforce strict Row-Level Security (RLS) and restrict sensitive operations (e.g. payout release, KYC approval, account suspension) to authorized administrative accounts.

---

## 📜 License

This project is part of the **CraftHive Mobile & Web Platform Final Year Project**. All rights reserved.
