import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, 
  Languages, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Users, 
  ArrowRight,
  ShieldAlert,
  LayoutDashboard,
  Gamepad2
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import sound from '../../components/SoundEngine.js';
import { useConfirmStore } from '../../stores/confirmStore.js';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirmStore(state => state.confirm);
  const [feedback, setFeedback] = useState(null);

  // Fetch Counts/Stats
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/stats');
      return res.data;
    }
  });

  const stats = statsRes?.counts || {
    languages: 0,
    units: 0,
    chapters: 0,
    lessons: 0,
    exercises: 0,
    users: 0
  };

  // Seeding Mutation
  const seedMutation = useMutation({
    mutationFn: async (track = 'all') => {
      const res = await axiosClient.post('/admin/seed', { track });
      return res.data;
    },
    onSuccess: (data) => {
      sound.playLevelUp();
      setFeedback({ success: true, message: data.message });
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      sound.playIncorrect();
      setFeedback({ success: false, message: err.response?.data?.error || 'Seeding failed.' });
    }
  });

  const triggerSeed = async (track = 'all') => {
    sound.playClick();
    const ok = await confirm({
      title: 'Seed Coursework?',
      message: `Are you sure you want to seed the database with the ${track === 'all' ? 'default Spanish & English' : track} coursework curriculum?`,
      confirmText: 'Seed Database',
      cancelText: 'Cancel'
    });
    if (ok) {
      seedMutation.mutate(track);
    }
  };

  const menuItems = [
    {
      name: 'Languages',
      path: '/admin/languages',
      description: 'Manage active learner tracks, flag emojis, codes, and activation toggles.',
      icon: Languages,
      count: stats.languages,
      color: 'text-pink-500 bg-pink-500/10'
    },
    {
      name: 'Course Units',
      path: '/admin/units',
      description: 'Group content chapters under core syllabus sections and languages.',
      icon: BookOpen,
      count: stats.units,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      name: 'Chapters',
      path: '/admin/chapters',
      description: 'Break units down into modules, titles, descriptions, and targets.',
      icon: LayoutDashboard,
      count: stats.chapters,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      name: 'Lessons',
      path: '/admin/lessons',
      description: 'Create lesson cards, configure XP rewards, and edit goals.',
      icon: FileText,
      count: stats.lessons,
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      name: 'Quiz Exercises',
      path: '/admin/exercises',
      description: 'Write multiple choice, fill in the blanks, true/false, or matching items.',
      icon: HelpCircle,
      count: stats.exercises,
      color: 'text-orange-500 bg-orange-500/10'
    },
    {
      name: 'Registered Users',
      path: '/admin/users',
      description: 'Demote administrators, promote users, audit email addresses, and manage roles.',
      icon: Users,
      count: stats.users,
      color: 'text-rose-500 bg-rose-500/10'
    },
    {
      name: 'Gamification Configs',
      path: '/admin/gamification',
      description: 'Configure Daily Quests, Weekly Missions, Seasonal Events, and Avatar builder items.',
      icon: Gamepad2,
      count: '4 sections',
      color: 'text-violet-500 bg-violet-550/10'
    }
  ];

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-200/30 dark:border-zinc-800/30 pb-5">
        <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider font-heading">Secure Portal</span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight">Admin Control Panel</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Perform administrative database actions, curriculum CRUD updates, and manage developer seeds.
        </p>
      </div>

      {/* Feedback alert banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          feedback.success 
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' 
            : 'border-red-500/20 bg-red-500/5 text-red-500'
        }`}>
          <p className="text-sm font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* Grid of separate pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => sound.playClick()}
              className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.12)] transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${item.color} shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-bold font-number text-zinc-400 dark:text-zinc-550 group-hover:text-pink-500 transition-colors">
                    {statsLoading ? '...' : item.count}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-lg text-zinc-800 dark:text-zinc-100 group-hover:text-pink-500 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 mt-6 group-hover:translate-x-1.5 transition-transform duration-300">
                <span>Manage Resources</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Seed DB card */}
      <div className="p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium space-y-4">
        <h3 className="font-heading font-bold text-xl">Populate Course Curriculum</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-2xl">
          Seed your database with structured language tracks. Select a track to populate its units, chapters, lessons, and interactive quiz matching exercises.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button 
            onClick={() => triggerSeed('all')}
            disabled={seedMutation.isPending}
            className="btn-premium px-6 py-3 text-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Database className="w-4 h-4 fill-current" />
            <span>Seed Spanish Track (Default)</span>
          </button>
          <button 
            onClick={() => triggerSeed('english')}
            disabled={seedMutation.isPending}
            className="btn-premium px-6 py-3 text-xs flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 border-none cursor-pointer"
          >
            <Database className="w-4 h-4 fill-current text-white" />
            <span>Seed English Track</span>
          </button>
          <button 
            onClick={() => triggerSeed('hindi')}
            disabled={seedMutation.isPending}
            className="btn-premium px-6 py-3 text-xs flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 border-none cursor-pointer"
          >
            <Database className="w-4 h-4 fill-current text-white" />
            <span>Seed Hindi Track</span>
          </button>
        </div>
      </div>

    </div>
  );
}
