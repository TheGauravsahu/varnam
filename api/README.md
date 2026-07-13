# Varnam Backend REST API 🔱

This directory contains the Fastify REST server powering the Varnam language learning platform.

---

## 🛠️ Tech Stack & Dependencies

- **Fastify**: High-performance, low-overhead Node.js web framework.
- **Drizzle ORM & Drizzle Kit**: TypeScript-first ORM for query constructions and migrations.
- **Neon Serverless PostgreSQL**: Serverless database connector pools.
- **Bcrypt.js**: Salting and hashing passwords.
- **JSONWebToken (JWT)**: Security state cookies verification.

---

## 📂 Backend Architecture

```
api/
├── src/
│   ├── app.js        # Server bootloader & plugin configurations
│   ├── db/
│   │   ├── index.js  # Neon DB serverless client pools connection
│   │   ├── schema.js # Drizzle relational tables schema definitions
│   │   └── seedData.js # Pre-populated Spanish, English & Hindi courses
│   ├── middleware/
│   │   └── authMiddleware.js # preHandler hooks (requireAuth, requireAdmin)
│   ├── controllers/
│   │   ├── authController.js       # Signup, login, logout, password resets
│   │   ├── dashboardController.js  # Stat metrics, user progression ring maps
│   │   ├── lessonController.js     # Matching card quiz evaluation, XP logs
│   │   ├── profileController.js    # Badges earned list, user follow searches
│   │   └── adminController.js      # CRUD coursework managers & DB seeding
│   └── routes/
│       ├── authRoutes.js
│       ├── dashboardRoutes.js
│       ├── lessonRoutes.js
│       ├── profileRoutes.js
│       └── adminRoutes.js
├── package.json
└── drizzle.config.js
```

---

## 🚀 Getting Started

### 1. Set Up Environment Variables
Create a `.env` file in this folder:
```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=your-secure-jwt-secret-key-change-me
COOKIE_SECRET=your-secure-cookie-secret-key-change-me
NODE_ENV=development
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Push Database Schema
Ensure Neon DB credentials are set in `.env` and push the Drizzle schema to the database:
```bash
pnpm exec drizzle-kit push
```

### 4. Run Development Server
```bash
pnpm dev
```
The server will boot on `http://localhost:5000/`.
