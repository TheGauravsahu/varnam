import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import { calculateLevel } from '../utils/levelCalculator.js';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me-in-production';

// Fastify preHandler hook for mandatory authentication
export async function requireAuth(request, reply) {
  const token = request.cookies?.varnam_token || request.headers.authorization?.split(' ')[1];

  if (!token) {
    reply.status(401).send({ error: 'Unauthorized: No session token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepository.findById(decoded.userId);
    
    if (!user) {
      reply.clearCookie('varnam_token', { path: '/' });
      reply.status(401).send({ error: 'Unauthorized: Session user not found' });
      return;
    }

    user.levelStats = calculateLevel(user.profile?.xpTotal || 0);
    request.user = user;
  } catch (error) {
    reply.clearCookie('varnam_token', { path: '/' });
    reply.status(401).send({ error: 'Unauthorized: Invalid or expired session token' });
    return;
  }
}

// Fastify preHandler hook for optional authentication
export async function optionalAuth(request, reply) {
  const token = request.cookies?.varnam_token || request.headers.authorization?.split(' ')[1];
  request.user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await userRepository.findById(decoded.userId);
      if (user) {
        user.levelStats = calculateLevel(user.profile?.xpTotal || 0);
        request.user = user;
      }
    } catch (error) {
      reply.clearCookie('varnam_token', { path: '/' });
    }
  }
}

// Fastify preHandler hook for administrative access
export async function requireAdmin(request, reply) {
  // requireAuth must be run before requireAdmin to populate request.user
  if (!request.user || request.user.role !== 'admin') {
    reply.status(403).send({ error: 'Forbidden: Administrative access required' });
    return;
  }
}
