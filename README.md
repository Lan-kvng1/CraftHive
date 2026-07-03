<div align="center">
  <h1>🐝 CraftHive</h1>
  <p><strong>A Next-Generation Mobile Artisan Service Marketplace for Ghana</strong></p>

  [![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

<br />

CraftHive is a comprehensive, open-source digital marketplace designed to connect customers with verified local skilled artisans (plumbers, electricians, carpenters, etc.) through a secure, transparent, and accessible platform. 

Built as a Final Year Information Technology Project, it digitizes the informal skilled labor sector by introducing escrow payments, KYC verification, and real-time tracking.

**[🚀 View Live Admin Dashboard (Coming Soon)](#)**

---

## ✨ Key Features

- **📱 Dual Mobile Apps:** Dedicated interfaces for both Customers (booking & tracking) and Artisans (portfolio & job management).
- **💳 Secure Escrow Payments:** Funds are securely held until the customer confirms the job is completed.
- **🛡️ KYC & Verification:** Robust identity verification ensuring customer safety and artisan credibility.
- **💬 Real-Time Chat & Notifications:** Seamless in-app messaging and push notifications.
- **📊 Powerful Admin Dashboard:** A comprehensive Next.js web portal for system administrators to manage disputes, users, and platform analytics.

---

## 🛠️ Tech Stack

This project utilizes a modern, scalable, and type-safe architecture:

### Mobile Application (Customer & Artisan)
* **Framework:** [React Native](https://reactnative.dev/) via [Expo](https://expo.dev/)
* **Language:** TypeScript
* **State Management & Routing:** Expo Router

### Admin Web Dashboard
* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Styling:** Tailwind CSS + Radix UI
* **Language:** TypeScript

### Backend Architecture
* **BaaS:** [Supabase](https://supabase.com/)
* **Database:** PostgreSQL
* **Compute:** Supabase Edge Functions (Deno)
* **Storage:** Supabase Storage (for portfolios and KYC documents)

---

## 🚀 Getting Started

Follow these steps to run the CraftHive ecosystem locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or newer)
* Expo CLI (`npm install -g expo-cli`)
* A [Supabase](https://supabase.com/) account for backend configuration

### 1. Mobile Application
```bash
cd CraftHive
npm install
npx expo start
```

### 2. Admin Web Dashboard
```bash
cd crafthive-admin
npm install
npm run dev
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Franklin Kumi (Lan-kvng1)**
- GitHub: [@Lan-kvng1](https://github.com/Lan-kvng1)
- LinkedIn: [Franklin Kumi](https://www.linkedin.com/in/franklin-kumi-816b57346)

---

<div align="center">
  <sub>Built with ❤️ for the Final Year Information Technology Project.</sub>
</div>
