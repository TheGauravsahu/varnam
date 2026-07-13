import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useToastStore } from '../stores/toastStore.js';
import sound from '../components/SoundEngine.js';
import Logo from '../components/Logo.jsx';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default function ResetPasswordPage() {
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (data) => {
    sound.playClick();
    if (!token) {
      addToast('Reset token is missing from the URL.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/auth/reset-password', { token, password: data.password });
      setIsSubmitting(false);
      setSuccessMsg(res.data.message);
      sound.playLevelUp();
      addToast('Password updated successfully.', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setIsSubmitting(false);
      sound.playIncorrect();
      const errMsg = err.response?.data?.error || 'Failed to reset password.';
      addToast(errMsg, 'error');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-12 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* SaaS Glowing Background Overlays */}
      <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-pink-500/10 dark:bg-pink-500/5 rounded-full pointer-events-none -z-10 pulsing-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-rose-500/10 dark:bg-rose-500/5 rounded-full pointer-events-none -z-10 pulsing-glow" />

      <div className="w-full max-w-md p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium space-y-8 relative z-10">
        
        {/* Card Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-heading font-semibold text-pink-600 dark:text-pink-400">
            <Logo className="w-8 h-8" />
            <span>Varnam</span>
          </Link>
          <h2 className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50">Reset Password</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Please type and confirm your new account password.</p>
        </div>

        {!token && (
          <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold leading-relaxed">
              Reset token is invalid or missing. Please navigate using a valid reset link.
            </p>
          </div>
        )}

        {successMsg ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-relaxed">
                {successMsg} Redirecting you to the login screen...
              </p>
            </div>
          </div>
        ) : (
          token && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-950/20 text-sm font-medium transition-all focus:outline-none ${
                      errors.password ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setShowPass(!showPass); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-655"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-950/20 text-sm font-medium transition-all focus:outline-none ${
                      errors.confirmPassword ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setShowConfirm(!showConfirm); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-655"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.confirmPassword.message}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-premium w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Updating Password...' : 'Reset Password'}</span>
              </button>

            </form>
          )
        )}

      </div>
    </div>
  );
}
