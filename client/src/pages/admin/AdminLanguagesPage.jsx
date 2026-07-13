import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft, Languages, Check, X, ShieldAlert } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToastStore } from '../../stores/toastStore.js';
import { useConfirmStore } from '../../stores/confirmStore.js';
import sound from '../../components/SoundEngine.js';
import Modal from '../../components/Modal.jsx';

export default function AdminLanguagesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const confirm = useConfirmStore(state => state.confirm);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', flagEmoji: '', isActive: true });

  // 1. Fetch Languages
  const { data: langsRes, isLoading } = useQuery({
    queryKey: ['admin-languages'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/languages');
      return res.data;
    }
  });

  const languagesList = langsRes?.data || [];

  // 2. Mutation for saving (create/update)
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editId) {
        const res = await axiosClient.put(`/admin/languages/${editId}`, payload);
        return res.data;
      } else {
        const res = await axiosClient.post('/admin/languages', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast(editId ? 'Language updated successfully' : 'Language created successfully', 'success');
      setFormOpen(false);
      setEditId(null);
      setFormData({ code: '', name: '', flagEmoji: '', isActive: true });
      queryClient.invalidateQueries({ queryKey: ['admin-languages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to save language', 'error');
    }
  });

  // 3. Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(`/admin/languages/${id}`);
      return res.data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast('Language deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-languages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to delete language', 'error');
    }
  });

  const handleEdit = (lang) => {
    sound.playClick();
    setEditId(lang.id);
    setFormData({
      code: lang.code,
      name: lang.name,
      flagEmoji: lang.flagEmoji,
      isActive: lang.isActive
    });
    setFormOpen(true);
  };

  const handleCreate = () => {
    sound.playClick();
    setEditId(null);
    setFormData({ code: '', name: '', flagEmoji: '', isActive: true });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    sound.playClick();
    const confirmed = await confirm({
      title: 'Delete Language Track?',
      message: 'Are you sure you want to delete this language? This could affect linked units!',
      confirmText: 'Delete Language',
      cancelText: 'Cancel'
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    if (!formData.code || !formData.name || !formData.flagEmoji) {
      addToast('All fields are required', 'error');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-3">
        <Link 
          to="/admin" 
          onClick={() => sound.playClick()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-pink-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Control Panel</span>
        </Link>
        
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-heading font-extrabold tracking-tight flex items-center gap-2.5">
              <Languages className="w-8 h-8 text-pink-500" />
              <span>Languages Management</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Create, update, or disable learner tracks and codes.
            </p>
          </div>
          <button onClick={handleCreate} className="btn-premium px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-none">
            <Plus className="w-4 h-4" />
            <span>Add Language</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
        </div>
      ) : (
        <div className="border border-zinc-200/40 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold text-zinc-400 border-b border-zinc-200/30 dark:border-zinc-800/30 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-20">Flag</th>
                <th className="px-6 py-4 w-24">ISO Code</th>
                <th className="px-6 py-4">Language Name</th>
                <th className="px-6 py-4 w-32">Status</th>
                <th className="px-6 py-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/20 dark:divide-zinc-800/20">
              {languagesList.map(lang => (
                <tr key={lang.id} className="text-sm hover:bg-gradient-to-r hover:from-pink-500/10 hover:via-pink-500/5 hover:to-transparent transition-all duration-300">
                  <td className="px-6 py-4 text-2xl">{lang.flagEmoji}</td>
                  <td className="px-6 py-4 font-mono font-bold text-pink-600 dark:text-pink-400">{lang.code}</td>
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">{lang.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                      lang.isActive 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                    }`}>
                      {lang.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{lang.isActive ? 'Active' : 'Disabled'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleEdit(lang)} 
                      className="text-zinc-400 hover:text-pink-500 transition-colors inline-block"
                      title="Edit Language"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(lang.id)} 
                      className="text-zinc-400 hover:text-red-500 transition-colors inline-block"
                      title="Delete Language"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {languagesList.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No languages added yet. Seed the database to create active courses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Language Creator / Editor Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit Language Track' : 'Create Language Track'}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Language Name</label>
            <input 
              type="text" 
              placeholder="e.g. Spanish"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">ISO Code (e.g. es)</label>
              <input 
                type="text" 
                placeholder="es"
                maxLength="3"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Flag Emoji</label>
              <input 
                type="text" 
                placeholder="🇪🇸"
                maxLength="4"
                value={formData.flagEmoji}
                onChange={(e) => setFormData({ ...formData, flagEmoji: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-zinc-300 text-pink-600 focus:ring-pink-500 h-4 w-4"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              Active learner course track (allows users to select it)
            </label>
          </div>

          <button type="submit" disabled={saveMutation.isPending} className="btn-premium w-full py-3.5 text-sm font-semibold">
            {saveMutation.isPending ? 'Saving...' : 'Save Language Track'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
