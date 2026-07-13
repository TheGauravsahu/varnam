import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me-in-production';
const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Lax works best with local decoupled development ports
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const authController = {
  async postSignup(request, reply) {
    const { username, email, password } = request.body || {};

    if (!username || !email || !password) {
      reply.status(400).send({ error: 'Username, email, and password are required.' });
      return;
    }

    try {
      const existingEmail = await userRepository.findByEmail(email);
      if (existingEmail) {
        reply.status(400).send({ error: 'Email already in use.' });
        return;
      }

      const existingUsername = await userRepository.findByUsername(username);
      if (existingUsername) {
        reply.status(400).send({ error: 'Username already in use.' });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await userRepository.createUser({
        username,
        email,
        password: hashedPassword,
        role: 'user' // Default role
      });

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Set cookie
      reply.setCookie('varnam_token', token, COOKIE_OPTIONS);

      // Remove sensitive data
      delete user.password;

      return { success: true, user };
    } catch (error) {
      request.log.error('Signup error:', error);
      reply.status(500).send({ error: 'Internal server error during registration.' });
    }
  },

  async postLogin(request, reply) {
    const { email, password } = request.body || {};

    if (!email || !password) {
      reply.status(400).send({ error: 'Email and password are required.' });
      return;
    }

    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        reply.status(400).send({ error: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        reply.status(400).send({ error: 'Invalid email or password.' });
        return;
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Set cookie
      reply.setCookie('varnam_token', token, COOKIE_OPTIONS);

      // Remove sensitive data
      delete user.password;

      return { success: true, user };
    } catch (error) {
      request.log.error('Login error:', error);
      reply.status(500).send({ error: 'Internal server error during authentication.' });
    }
  },

  async postLogout(request, reply) {
    reply.clearCookie('varnam_token', { path: '/' });
    return { success: true, message: 'Logged out successfully.' };
  },

  async getMe(request, reply) {
    if (!request.user) {
      return { success: true, user: null };
    }
    
    const userCopy = { ...request.user };
    delete userCopy.password;
    
    return { success: true, user: userCopy };
  }
};
