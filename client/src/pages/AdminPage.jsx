import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Crown, 
  Database, 
  Languages, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import sound from '../components/SoundEngine.js';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [feedback, setFeedback] = useState(null);

  // Edit / Form overlay states
  const [editTarget, setEditTarget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({});

  // 1. Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/stats');
      return res.data;
    }
  });

  // 2. Fetch Languages
  const { data: langsData } = useQuery({
    queryKey: ['admin-languages'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/languages');
      return res.data;
    }
  });

  // 3. Fetch Units
  const { data: unitsData } = useQuery({
    queryKey: ['admin-units'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/units');
      return res.data;
    }
  });

  // 4. Fetch Chapters
  const { data: chaptersData } = useQuery({
    queryKey: ['admin-chapters'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/chapters');
      return res.data;
    }
  });

  // 5. Fetch Lessons
  const { data: lessonsData } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/lessons');
      return res.data;
    }
  });

  // 6. Fetch Exercises
  const { data: exercisesData } = useQuery({
    queryKey: ['admin-exercises'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/exercises');
      return res.data;
    }
  });

  // 7. Fetch Users
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/users');
      return res.data;
    }
  });

  // ----------------------------------------------------
  // MUTATIONS (C-U-D operations)
  // ----------------------------------------------------

  // Seeding
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/admin/seed');
      return res.data;
    },
    onSuccess: (data) => {
      sound.playLevelUp();
      setFeedback({ success: true, message: data.message });
      queryClient.invalidateQueries();
    }
  });

  // CRUD mutations
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      const res = await axiosClient.delete(`/admin/${type}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      queryClient.invalidateQueries();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, id, payload }) => {
      if (id) {
        const res = await axiosClient.put(`/admin/${type}/${id}`, payload);
        return res.data;
      } else {
        const res = await axiosClient.post(`/admin/${type}`, payload);
        return res.data;
      }
    },
    onSuccess: () => {
      sound.playLevelUp();
      setFormOpen(false);
      setEditTarget(null);
      setFormData({});
      queryClient.invalidateQueries();
    }
  });

  const triggerSeed = () => {
    sound.playClick();
    if (window.confirm('Seed database with initial coursework curriculum?')) {
      seedMutation.mutate();
    }
  };

  const handleDelete = (type, id) => {
    sound.playClick();
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      deleteMutation.mutate({ type, id });
    }
  };

  const handleEdit = (type, item) => {
    sound.playClick();
    setEditTarget({ type, id: item.id });
    setFormData(item);
    setFormOpen(true);
  };

  const handleCreate = (type) => {
    sound.playClick();
    setEditTarget({ type, id: null });
    setFormData({});
    setFormOpen(true);
  };

  const onFormSave = (e) => {
    e.preventDefault();
    sound.playClick();
    saveMutation.mutate({
      type: editTarget.type,
      id: editTarget.id,
      payload: formData
    });
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Crown className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage active language tracks, seed lessons, and edit student profiles.</p>
        </div>
      </header>

      {/* Admin Tab buttons */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-150 dark:border-zinc-850 pb-4">
        {[
          { key: 'overview', name: 'Overview & Seeding', icon: Database },
          { key: 'languages', name: 'Languages', icon: Languages },
          { key: 'units', name: 'Units', icon: BookOpen },
          { key: 'chapters', name: 'Chapters', icon: BookOpen },
          { key: 'lessons', name: 'Lessons', icon: FileText },
          { key: 'exercises', name: 'Exercises', icon: HelpCircle },
          { key: 'users', name: 'Users', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { sound.playClick(); setActiveTab(tab.key); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key 
                  ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400' 
                  : 'text-zinc-500 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-850'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 animate-bounce" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ----------------------------- */}
      {/* TAB CONTENT OVERVIEWS */}
      {/* ----------------------------- */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Stats counters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Registered Users</span>
              <span className="text-3xl font-bold font-number mt-1 block text-pink-600 dark:text-pink-400">
                {statsData?.stats?.users || 0}
              </span>
            </div>
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Lessons Finished</span>
              <span className="text-3xl font-bold font-number mt-1 block text-pink-600 dark:text-pink-400">
                {statsData?.stats?.completions || 0}
              </span>
            </div>
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Active Exercises</span>
              <span className="text-3xl font-bold font-number mt-1 block text-pink-600 dark:text-pink-400">
                {statsData?.stats?.exercises || 0}
              </span>
            </div>
          </div>

          {/* Seed DB card */}
          <div className="p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-4">
            <h3 className="font-heading font-bold text-xl">Populate Initial Course Track</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-2xl">
              Seed your Neon Postgres database with the initial Spanish and English tracks. Seeding writes default units, chapters, lesson goals, achievements, and matching quiz exercises.
            </p>
            <button 
              onClick={triggerSeed}
              disabled={seedMutation.isPending}
              className="btn-premium px-8 py-3.5 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Database className="w-5 h-5 fill-current" />
              <span>{seedMutation.isPending ? 'Seeding Database...' : 'Seed Course & Achievements Data'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. LANGUAGES TAB */}
      {activeTab === 'languages' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-lg">Active Languages</h3>
            <button onClick={() => handleCreate('languages')} className="btn-premium px-4 py-2 text-xs flex items-center gap-1 shadow-none">
              <Plus className="w-4 h-4" />
              <span>Add Language</span>
            </button>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-500 border-b border-zinc-150 dark:border-zinc-850">
                <tr>
                  <th className="px-6 py-3">Flag</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {langsData?.data?.map(lang => (
                  <tr key={lang.id} className="text-sm">
                    <td className="px-6 py-3 text-lg">{lang.flagEmoji}</td>
                    <td className="px-6 py-3 font-semibold">{lang.code}</td>
                    <td className="px-6 py-3">{lang.name}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lang.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                        {lang.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit('languages', lang)} className="text-zinc-500 hover:text-pink-500"><Edit className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete('languages', lang.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. UNITS TAB */}
      {activeTab === 'units' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-lg">Course Units</h3>
            <button onClick={() => handleCreate('units')} className="btn-premium px-4 py-2 text-xs flex items-center gap-1 shadow-none">
              <Plus className="w-4 h-4" />
              <span>Add Unit</span>
            </button>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-500 border-b border-zinc-150 dark:border-zinc-850">
                <tr>
                  <th className="px-6 py-3 w-16">Language</th>
                  <th className="px-6 py-3 w-16 text-center">Unit #</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {unitsData?.data?.map(unit => (
                  <tr key={unit.id} className="text-sm">
                    <td className="px-6 py-3 font-number">Lang {unit.languageId}</td>
                    <td className="px-6 py-3 text-center font-number">{unit.number}</td>
                    <td className="px-6 py-3 font-semibold">{unit.title}</td>
                    <td className="px-6 py-3 text-xs text-zinc-500 max-w-xs truncate">{unit.description}</td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit('units', unit)} className="text-zinc-500 hover:text-pink-500"><Edit className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete('units', unit.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CHAPTERS TAB */}
      {activeTab === 'chapters' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-lg">Chapters</h3>
            <button onClick={() => handleCreate('chapters')} className="btn-premium px-4 py-2 text-xs flex items-center gap-1 shadow-none">
              <Plus className="w-4 h-4" />
              <span>Add Chapter</span>
            </button>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-500 border-b border-zinc-150 dark:border-zinc-850">
                <tr>
                  <th className="px-6 py-3 w-16">Unit ID</th>
                  <th className="px-6 py-3 w-16 text-center">Chapter #</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {chaptersData?.data?.map(chap => (
                  <tr key={chap.id} className="text-sm">
                    <td className="px-6 py-3 font-number">Unit {chap.unitId}</td>
                    <td className="px-6 py-3 text-center font-number">{chap.number}</td>
                    <td className="px-6 py-3 font-semibold">{chap.title}</td>
                    <td className="px-6 py-3 text-xs text-zinc-500 max-w-xs truncate">{chap.description}</td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit('chapters', chap)} className="text-zinc-500 hover:text-pink-500"><Edit className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete('chapters', chap.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. LESSONS TAB */}
      {activeTab === 'lessons' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-lg">Lessons</h3>
            <button onClick={() => handleCreate('lessons')} className="btn-premium px-4 py-2 text-xs flex items-center gap-1 shadow-none">
              <Plus className="w-4 h-4" />
              <span>Add Lesson</span>
            </button>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-500 border-b border-zinc-150 dark:border-zinc-850">
                <tr>
                  <th className="px-6 py-3 w-16">Chap ID</th>
                  <th className="px-6 py-3 w-16 text-center">Lesson #</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3 w-24 text-center">XP Reward</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {lessonsData?.data?.map(les => (
                  <tr key={les.id} className="text-sm">
                    <td className="px-6 py-3 font-number">Chap {les.chapterId}</td>
                    <td className="px-6 py-3 text-center font-number">{les.number}</td>
                    <td className="px-6 py-3 font-semibold">{les.title}</td>
                    <td className="px-6 py-3 text-center font-number text-pink-600 dark:text-pink-400">+{les.xpReward} XP</td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit('lessons', les)} className="text-zinc-500 hover:text-pink-500"><Edit className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete('lessons', les.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. EXERCISES TAB */}
      {activeTab === 'exercises' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-lg">Quiz Exercises</h3>
            <button onClick={() => handleCreate('exercises')} className="btn-premium px-4 py-2 text-xs flex items-center gap-1 shadow-none">
              <Plus className="w-4 h-4" />
              <span>Add Exercise</span>
            </button>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-500 border-b border-zinc-150 dark:border-zinc-850">
                <tr>
                  <th className="px-6 py-3 w-16">Lesson ID</th>
                  <th className="px-6 py-3 w-28">Type</th>
                  <th className="px-6 py-3">Instruction</th>
                  <th className="px-6 py-3">Question Text</th>
                  <th className="px-6 py-3">Correct Answer</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {exercisesData?.data?.map(ex => (
                  <tr key={ex.id} className="text-sm">
                    <td className="px-6 py-3 font-number">Les {ex.lessonId}</td>
                    <td className="px-6 py-3 text-xs uppercase font-bold tracking-wider text-pink-600 dark:text-pink-400">{ex.type}</td>
                    <td className="px-6 py-3 text-xs text-zinc-500">{ex.instruction}</td>
                    <td className="px-6 py-3 font-semibold">{ex.questionText}</td>
                    <td className="px-6 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{ex.correctAnswer}</td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit('exercises', ex)} className="text-zinc-500 hover:text-pink-500"><Edit className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete('exercises', ex.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h3 className="font-heading font-bold text-lg">Registered Users</h3>
          <div className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-premium rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-500 border-b border-zinc-150 dark:border-zinc-850">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {usersData?.data?.map(u => (
                  <tr key={u.id} className="text-sm">
                    <td className="px-6 py-3 font-number">{u.id}</td>
                    <td className="px-6 py-3 font-semibold">{u.username}</td>
                    <td className="px-6 py-3">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-pink-500/10 text-pink-500' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {u.role === 'admin' ? (
                        <button 
                          onClick={() => { sound.playClick(); saveMutation.mutate({ type: 'users', id: u.id, payload: { role: 'user' } }); }}
                          className="text-xs text-zinc-500 hover:text-pink-500 mr-4"
                        >
                          Demote User
                        </button>
                      ) : (
                        <button 
                          onClick={() => { sound.playClick(); saveMutation.mutate({ type: 'users', id: u.id, payload: { role: 'admin' } }); }}
                          className="text-xs text-pink-600 hover:text-pink-500 mr-4 font-semibold"
                        >
                          Promote Admin
                        </button>
                      )}
                      <button onClick={() => handleDelete('users', u.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------- */}
      {/* OVERLAY DIALOGS FOR CREATION/EDITS */}
      {/* ----------------------------- */}
      {formOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-premium">
            <h3 className="text-lg font-heading font-bold mb-4">
              {editTarget.id ? 'Edit' : 'Create New'} {editTarget.type.toUpperCase()}
            </h3>

            <form onSubmit={onFormSave} className="space-y-4">
              {/* LANGUAGES Form */}
              {editTarget.type === 'languages' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Language Code</label>
                    <input 
                      type="text" 
                      value={formData.code || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Language Name</label>
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Flag Emoji</label>
                    <input 
                      type="text" 
                      value={formData.flagEmoji || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, flagEmoji: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* UNITS Form */}
              {editTarget.type === 'units' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Language ID</label>
                    <input 
                      type="number" 
                      value={formData.languageId || 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, languageId: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Unit Number</label>
                    <input 
                      type="number" 
                      value={formData.number || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Title</label>
                    <input 
                      type="text" 
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Description</label>
                    <textarea 
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* CHAPTERS Form */}
              {editTarget.type === 'chapters' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Unit ID</label>
                    <input 
                      type="number" 
                      value={formData.unitId || 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Chapter Number</label>
                    <input 
                      type="number" 
                      value={formData.number || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Title</label>
                    <input 
                      type="text" 
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Description</label>
                    <textarea 
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* LESSONS Form */}
              {editTarget.type === 'lessons' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Chapter ID</label>
                    <input 
                      type="number" 
                      value={formData.chapterId || 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, chapterId: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Lesson Number</label>
                    <input 
                      type="number" 
                      value={formData.number || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Title</label>
                    <input 
                      type="text" 
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">XP Reward</label>
                    <input 
                      type="number" 
                      value={formData.xpReward || 10}
                      onChange={(e) => setFormData(prev => ({ ...prev, xpReward: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* EXERCISES Form */}
              {editTarget.type === 'exercises' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Lesson ID</label>
                    <input 
                      type="number" 
                      value={formData.lessonId || 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, lessonId: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Exercise Type</label>
                    <select 
                      value={formData.type || 'multiple_choice'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True / False</option>
                      <option value="fill_blank">Fill in the Blanks</option>
                      <option value="matching">Matching Pairs</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Instruction Text</label>
                    <input 
                      type="text" 
                      value={formData.instruction || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, instruction: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Question Text</label>
                    <input 
                      type="text" 
                      value={formData.questionText || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Correct Answer</label>
                    <input 
                      type="text" 
                      value={formData.correctAnswer || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      required 
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Choices (JSON string or list split by |)</label>
                    <textarea 
                      placeholder='e.g., ["choice1", "choice2"] or for matching split left:right: [{"left":"Hola","right":"Goodbye"}]'
                      value={typeof formData.choices === 'object' ? JSON.stringify(formData.choices) : formData.choices || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, choices: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Sort Order #</label>
                    <input 
                      type="number" 
                      value={formData.order || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-850">
                <button 
                  type="button" 
                  onClick={() => { sound.playClick(); setFormOpen(false); }}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-105"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="btn-premium px-5 py-2 text-xs shadow-none disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
