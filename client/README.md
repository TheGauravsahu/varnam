# Varnam Client SPA 🔱

This directory contains the Vite + React client application for Varnam.

---

## 🛠️ Tech Stack & Utilities

- **Vite & React 19**: Lightning-fast compilation and single-page routing.
- **Zustand**: Lightweight global state management for authorization and toast triggers.
- **TanStack React Query (v5)**: Clean cache invalidation and query mutation handlers.
- **Tailwind CSS v4**: Utility-first CSS classes and custom variants.
- **GSAP (GreenSock)**: Fluid entrance animations and micro-interaction staggers.
- **Lucide React**: Clean visual icon components.

---

## 📂 Client Folder Structure

```
client/
├── public/
│   ├── favicon.svg     # Brand sparkles SVG icon
│   ├── manifest.json   # PWA requirements mapping
│   └── sw.js           # Progressive Web App asset cacher
├── src/
│   ├── api/
│   │   └── axiosClient.js # Axios instance pointing to backend (Port 5000)
│   ├── components/
│   │   ├── Layout.jsx         # Responsive sidebar/bottom-tab navigation shell
│   │   ├── Footer.jsx         # Attribution link to Gaurav Sahu
│   │   ├── Logo.jsx           # Sparkles SVG logo
│   │   ├── ErrorBoundary.jsx  # Fallback error container for React crashes
│   │   ├── SuspenseBoundary.jsx # Fallback loading spinners
│   │   ├── ToastContainer.jsx  # Floating toast notifications
│   │   └── SoundEngine.js     # Web Audio API sound generator
│   ├── stores/
│   │   ├── authStore.js       # User session state manager
│   │   └── toastStore.js      # Floating alerts manager
│   ├── pages/
│   │   ├── LandingPage.jsx    # Hero, live demo, FAQ accordion
│   │   ├── LoginPage.jsx      # Password toggler & Zod validation
│   │   ├── SignupPage.jsx     # Registration forms
│   │   ├── ForgotPasswordPage.jsx # Password reset link generator
│   │   ├── ResetPasswordPage.jsx  # Form to input and save new password
│   │   ├── DashboardPage.jsx  # Curriculum lock maps, progression ring
│   │   ├── LessonPage.jsx     # Matching cards game, quiz options
│   │   ├── LeaderboardPage.jsx # League podiums and ranking list
│   │   ├── LevelsPage.jsx      # Mastery classification levels (A1 to C2)
│   │   ├── ProfilePage.jsx     # Badge grid, follow search queries
│   │   └── AdminPage.jsx      # Coursework CRUD control panel
│   ├── App.jsx         # Global route protection and boundaries
│   ├── main.jsx        # SPA mount loader
│   └── index.css       # Tailwind v4 configuration, theme colors & animations
├── vite.config.js
└── package.json
```

---

## 🚀 Getting Started

### 1. Configure API URL
Create a `.env` file in this directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Development Server
```bash
pnpm dev
```
The client app will launch at `http://localhost:5173/`.
