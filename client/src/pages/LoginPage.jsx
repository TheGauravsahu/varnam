import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore.js';
import { useToastStore } from '../stores/toastStore.js';
import sound from '../components/SoundEngine.js';
import Logo from '../components/Logo.jsx';

// Validation Schema using Zod
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export default function LoginPage() {
  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    sound.playClick();
    setAuthError(null);
    setIsSubmitting(true);
    
    const result = await login(data.email, data.password);
    setIsSubmitting(false);

    if (result.success) {
      sound.playLevelUp(); // play success chime
      addToast('Welcome back to Varnam!', 'success');
      navigate('/dashboard');
    } else {
      sound.playIncorrect(); // play thud
      const errMsg = result.error || 'Invalid credentials';
      setAuthError(errMsg);
      addToast(errMsg, 'error');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-12 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* SaaS Glowing Background Overlays */}
      <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-pink-500/10 dark:bg-pink-500/5 rounded-full pointer-events-none -z-10 pulsing-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-rose-500/10 dark:bg-rose-500/5 rounded-full pointer-events-none -z-10 pulsing-glow" />

      {/* Glassmorphic SaaS Login Card */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium space-y-8 relative z-10">
        
        {/* Card Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-heading font-semibold text-pink-600 dark:text-pink-400">
            <Logo className="w-8 h-8" />
            <span>Varnam</span>
          </Link>
          <h2 className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50">Welcome back</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Enter your credentials to continue learning</p>
        </div>

        {/* Global Error Toast */}
        {authError && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email Address</label>
            <input 
              {...register('email')}
              type="email" 
              id="email" 
              placeholder="you@example.com"
              className={`w-full px-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-950/20 focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-all text-base ${
                errors.email ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Password</label>
              <a href="#" className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <input 
                {...register('password')}
                type={showPassword ? 'text' : 'password'} 
                id="password" 
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-12 rounded-xl border bg-zinc-50 dark:bg-zinc-950/20 focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-all text-base ${
                  errors.password ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              />
              <button 
                type="button" 
                onClick={() => { sound.playClick(); setShowPassword(!showPassword); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-premium w-full py-3.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Logging In...' : 'Log In'}</span>
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Toggle link */}
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          <span>Don't have an account?</span>
          <Link 
            to="/signup" 
            onClick={() => sound.playClick()}
            className="font-semibold text-pink-600 dark:text-pink-400 hover:underline ml-1"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
