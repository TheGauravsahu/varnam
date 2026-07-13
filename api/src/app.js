import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import compress from "@fastify/compress";
import "dotenv/config";

// Import REST routing modules
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const fastify = Fastify({
  logger: true, // Pure default JSON logs (safe, zero extra package dependencies)
});

const PORT = process.env.PORT || 5000;

// Register Fastify Middlewares & Plugins
await fastify.register(cors, {
  origin: [
    process.env.NODE_ENV === "prod"
      ? process.env.CLIENT_URL
      : "http://localhost:5173",
  ], // React client domains
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

await fastify.register(cookie, {
  secret: process.env.JWT_SECRET || "cookie-secret-key-change-me",
});

await fastify.register(helmet, {
  contentSecurityPolicy: false, // API backend only, CSP header is handled by client host
});

await fastify.register(compress);

// Rate limiter for production deployment
if (process.env.NODE_ENV === "production") {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "15m",
  });
}

// Register API Routes
await fastify.register(authRoutes, { prefix: "/api/auth" });
await fastify.register(dashboardRoutes, { prefix: "/api/dashboard" });
await fastify.register(lessonRoutes, { prefix: "/api/lessons" });
await fastify.register(profileRoutes, { prefix: "/api/profile" });
await fastify.register(adminRoutes, { prefix: "/api/admin" });

// Health Check route
fastify.get("/health", async () => {
  return { status: "healthy", timestamp: new Date() };
});

// Global API Error Handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    reply
      .status(400)
      .send({ error: `Schema Validation Error: ${error.message}` });
    return;
  }

  reply.status(error.statusCode || 500).send({
    error: error.message || "Internal Server Error",
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Fastify REST API running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
