# CraftHive 🐝

**CraftHive: A Mobile-Based Artisan Service Marketplace**

CraftHive is a comprehensive digital marketplace designed to connect customers with verified local skilled artisans (plumbers, electricians, carpenters, tilers, painters, etc.) through a secure, transparent, and accessible platform.

Built as a final-year project to digitize and formalize the informal skilled labor sector, it features real-time service booking, an escrow-based payment system, verified KYC profiles, and structured dispute resolution.

## 🚀 Features

- **Customer Mobile App**: Discover artisans, book services, track jobs, and make secure payments.
- **Artisan Mobile App**: Receive job requests, manage schedule, upload portfolio, and track earnings.
- **Admin Web Dashboard**: Role-based analytics, user management, KYC verification approvals, and dispute resolution.
- **Escrow Payments**: Funds are held securely until the job is confirmed complete by the customer.
- **Real-Time Chat**: Integrated messaging between customers and artisans.

## 🛠️ Tech Stack

- **Mobile Application**: React Native (Expo)
- **Web Dashboard**: Next.js, React, Tailwind CSS
- **Backend / Database**: Supabase (PostgreSQL, Edge Functions, Storage)
- **Language**: TypeScript

## 📂 Project Structure

- `/CraftHive` - The Expo React Native application (contains both Customer and Artisan flows).
- `/crafthive-admin` - The Next.js Admin Web Dashboard.

## ⚙️ Getting Started

### Prerequisites
- Node.js installed
- Expo CLI (`npm install -g expo-cli`)
- Supabase account & project

### Running the Mobile App
```bash
cd CraftHive
npm install
npx expo start
```

### Running the Admin Dashboard
```bash
cd crafthive-admin
npm install
npm run dev
```

---
*Developed as a Final Year Computer Science / Software Engineering Project.*
