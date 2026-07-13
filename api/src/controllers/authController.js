import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
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
  },

  async forgotPassword(request, reply) {
    const { email } = request.body || {};
    if (!email) {
      reply.status(400).send({ error: 'Email is required.' });
      return;
    }
    try {
      const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (userList.length === 0) {
        return { success: true, message: 'If that email is registered, a reset link has been generated.' };
      }
      
      const user = userList[0];
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await db.update(users)
        .set({ resetToken: token, resetExpires: expires })
        .where(eq(users.id, user.id));

      console.log(`========================================`);
      console.log(`[PASSWORD RESET] Link generated for ${email}:`);
      console.log(`http://localhost:5173/reset-password?token=${token}`);
      console.log(`========================================`);

      return { 
        success: true, 
        message: 'Password reset link generated. Check the server logs.',
        mockResetLink: `http://localhost:5173/reset-password?token=${token}`
      };
    } catch (error) {
      request.log.error('Forgot password error:', error);
      reply.status(500).send({ error: 'Internal server error.' });
    }
  },

  async resetPassword(request, reply) {
    const { token, password } = request.body || {};
    if (!token || !password) {
      reply.status(400).send({ error: 'Token and password are required.' });
      return;
    }
    try {
      const userList = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
      if (userList.length === 0) {
        reply.status(400).send({ error: 'Invalid or expired reset token.' });
        return;
      }
      
      const user = userList[0];
      if (user.resetExpires && new Date() > new Date(user.resetExpires)) {
        reply.status(400).send({ error: 'Reset token has expired.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await db.update(users)
        .set({ password: hashedPassword, resetToken: null, resetExpires: null })
        .where(eq(users.id, user.id));

      return { success: true, message: 'Password updated successfully.' };
    } catch (error) {
      request.log.error('Reset password error:', error);
      reply.status(500).send({ error: 'Internal server error.' });
    }
  }
};
