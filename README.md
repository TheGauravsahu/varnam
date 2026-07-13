# Varnam 🔱

Varnam is a next-generation language learning platform designed with modern, high-information-density aesthetics (inspired by Apple, Linear, and Arc). This repository features a completely decoupled architecture, consisting of a Fastify REST API backend and a React SPA frontend.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/TheGauravsahu/varnam)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![Fastify](https://img.shields.io/badge/Fastify-5-emerald.svg)](https://fastify.dev)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle--ORM-pg-orange.svg)](https://orm.drizzle.team)

---

## 🏗️ Project Architecture

Varnam is divided into two separate, independent subdirectories:

1. **`api/`** (Fastify REST Server)
   - Runs on Port `5000`
   - Configured with Helmet, Drizzle ORM, Neon Serverless PostgreSQL connection pools, Bcryptjs password hashing, and JWT cookies.
   - Includes robust API controllers for curriculum management, user statistics, leaderboard league progression, and profile queries.

2. **`client/`** (Vite + React SPA)
   - Runs on Port `5173`
   - Built with Zustand state managers, TanStack Query cache invalidations, Tailwind CSS v4, Lucide Icons, and GSAP staggers.
   - Includes custom visual boundaries (Error Boundaries, Suspense spinners), custom SVGs, PWA offline caching, and Web Audio API audio chimes.

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js** (v18 or higher)
- **PNPM** package manager (recommended)
- **Neon PostgreSQL** database instance

---

## 🛠️ Installation & Launch

### 1. Clone the Repository
```bash
git clone https://github.com/TheGauravsahu/varnam.git
cd varnam
```

### 2. Configure Environment Variables
Create a `.env` file in both `api/` and `client/` directories:

**For the Backend (`api/.env`):**
```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=your-secure-jwt-secret-key-change-me
COOKIE_SECRET=your-secure-cookie-secret-key-change-me
NODE_ENV=development
```

**For the Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Run Backend Server (`api/`)
```bash
cd api
pnpm install

# Push database migrations to Neon PostgreSQL
pnpm exec drizzle-kit push

# Start the dev server
pnpm dev
```

### 4. Run Frontend Client (`client/`)
```bash
cd ../client
pnpm install
pnpm dev
```

The frontend will start at `http://localhost:5173/`, and automatically proxy API queries to `http://localhost:5000/api`.

---

## 🧪 Database Seeding
Once logged in as an administrator (or when registering a default admin account), go to the **Admin Control Panel** (`/admin`) tab under `Overview & Seeding` to seed coursework curriculum:
- **Seed Spanish Track**: Populates basic and conversational greetings, food dining lessons, and Spanish achievements.
- **Seed English Track**: Populates travel directions, office introductions, work koordinations, and intermediate English grammar quizzes.
- **Seed Hindi Track**: Populates Devanagari script varnamala characters, salutations, namaste lessons, and Devanagari vowel matching exercises.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/TheGauravsahu/varnam) page for details.
