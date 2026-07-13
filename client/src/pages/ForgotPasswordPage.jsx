import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useToastStore } from '../stores/toastStore.js';
import sound from '../components/SoundEngine.js';
import Logo from '../components/Logo.jsx';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address')
});

export default function ForgotPasswordPage() {
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [mockLink, setMockLink] = useState('');
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    sound.playClick();
    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/auth/forgot-password', { email: data.email });
      setIsSubmitting(false);
      setSuccessMsg(res.data.message);
      if (res.data.mockResetLink) {
        setMockLink(res.data.mockResetLink);
      }
      sound.playLevelUp();
      addToast('Reset link generated successfully.', 'success');
    } catch (err) {
      setIsSubmitting(false);
      sound.playIncorrect();
      const errMsg = err.response?.data?.error || 'Failed to send reset link.';
      addToast(errMsg, 'error');
    }
  };

  const copyToClipboard = () => {
    sound.playClick();
    navigator.clipboard.writeText(mockLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h2 className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50">Forgot Password?</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Enter your email and we'll generate a password reset link.</p>
        </div>

        {successMsg ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-relaxed">{successMsg}</p>
            </div>

            {mockLink && (
              <div className="p-4 rounded-2xl border border-pink-500/20 bg-pink-500/5 space-y-3">
                <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest block">Developer Testing Reset Link</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={mockLink} 
                    className="flex-1 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-600 dark:text-zinc-350 focus:outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                  </button>
                </div>
                <Link 
                  to={`/reset-password?token=${mockLink.split('token=')[1]}`}
                  onClick={() => sound.playClick()}
                  className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline block text-center"
                >
                  Proceed to Reset Password Page &rarr;
                </Link>
              </div>
            )}

            <Link 
              to="/login"
              onClick={() => sound.playClick()}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-950/20 text-sm font-medium transition-all focus:outline-none ${
                    errors.email 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' 
                      : 'border-zinc-200 dark:border-zinc-800 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-premium w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Sending Request...' : 'Send Reset Link'}</span>
            </button>

            <Link 
              to="/login"
              onClick={() => sound.playClick()}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </form>
        )}

      </div>
    </div>
  );
}
