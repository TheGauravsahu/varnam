import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft, BookOpen, ShieldAlert } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToastStore } from '../../stores/toastStore.js';
import { useConfirmStore } from '../../stores/confirmStore.js';
import sound from '../../components/SoundEngine.js';
import Modal from '../../components/Modal.jsx';

export default function AdminUnitsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const confirm = useConfirmStore(state => state.confirm);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ languageId: '', number: '', title: '', description: '' });

  // 1. Fetch Units
  const { data: unitsRes, isLoading: unitsLoading } = useQuery({
    queryKey: ['admin-units'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/units');
      return res.data;
    }
  });

  // 2. Fetch Languages (for the form dropdown selection)
  const { data: langsRes } = useQuery({
    queryKey: ['admin-languages'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/languages');
      return res.data;
    }
  });

  const unitsList = unitsRes?.data || [];
  const languagesList = langsRes?.data || [];

  // Get flag/name mapping helper
  const getLanguageName = (langId) => {
    const lang = languagesList.find(l => l.id === parseInt(langId));
    return lang ? `${lang.flagEmoji} ${lang.name}` : `Lang #${langId}`;
  };

  // 3. Mutation for saving (create/update)
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editId) {
        const res = await axiosClient.put(`/admin/units/${editId}`, payload);
        return res.data;
      } else {
        const res = await axiosClient.post('/admin/units', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast(editId ? 'Unit updated successfully' : 'Unit created successfully', 'success');
      setFormOpen(false);
      setEditId(null);
      setFormData({ languageId: '', number: '', title: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-units'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to save unit', 'error');
    }
  });

  // 4. Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(`/admin/units/${id}`);
      return res.data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast('Unit deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-units'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to delete unit', 'error');
    }
  });

  const handleEdit = (unit) => {
    sound.playClick();
    setEditId(unit.id);
    setFormData({
      languageId: unit.languageId.toString(),
      number: unit.number.toString(),
      title: unit.title,
      description: unit.description
    });
    setFormOpen(true);
  };

  const handleCreate = () => {
    sound.playClick();
    setEditId(null);
    const defaultLang = languagesList[0]?.id?.toString() || '';
    setFormData({ languageId: defaultLang, number: '', title: '', description: '' });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    sound.playClick();
    const confirmed = await confirm({
      title: 'Delete Unit?',
      message: 'Are you sure you want to delete this unit? This will cascade delete linked chapters!',
      confirmText: 'Delete Unit',
      cancelText: 'Cancel'
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    if (!formData.languageId || !formData.number || !formData.title) {
      addToast('Language, Unit #, and Title are required', 'error');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
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
              <BookOpen className="w-8 h-8 text-pink-500" />
              <span>Syllabus Units</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure language core units and sections.
            </p>
          </div>
          <button onClick={handleCreate} className="btn-premium px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-none">
            <Plus className="w-4 h-4" />
            <span>Add Unit</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      {unitsLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
        </div>
      ) : (
        <div className="border border-zinc-200/40 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold text-zinc-400 border-b border-zinc-200/30 dark:border-zinc-800/30 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-32">Course</th>
                <th className="px-6 py-4 w-24 text-center">Unit #</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 max-w-xs">Description</th>
                <th className="px-6 py-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/20 dark:divide-zinc-800/20">
              {unitsList.map(unit => (
                <tr key={unit.id} className="text-sm hover:bg-gradient-to-r hover:from-pink-500/10 hover:via-pink-500/5 hover:to-transparent transition-all duration-300">
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">
                    {getLanguageName(unit.languageId)}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-pink-600 dark:text-pink-400">
                    {unit.number}
                  </td>
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">{unit.title}</td>
                  <td className="px-6 py-4 text-xs text-zinc-500 max-w-xs truncate">{unit.description}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleEdit(unit)} 
                      className="text-zinc-400 hover:text-pink-500 transition-colors inline-block"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(unit.id)} 
                      className="text-zinc-400 hover:text-red-500 transition-colors inline-block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {unitsList.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No curriculum units added yet. Use the seeding options to initialize course modules.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Unit modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit Course Unit' : 'Create Course Unit'}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Target Language Track</label>
            <select
              value={formData.languageId}
              onChange={(e) => setFormData({ ...formData, languageId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all dark:text-white"
            >
              <option value="" disabled className="text-zinc-500">Select language...</option>
              {languagesList.map(lang => (
                <option key={lang.id} value={lang.id} className="dark:text-black">
                  {lang.flagEmoji} {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Unit Number</label>
              <input 
                type="number" 
                placeholder="1"
                min="1"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Unit Title</label>
              <input 
                type="text" 
                placeholder="e.g. Introduction to Spanish"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Description</label>
            <textarea 
              placeholder="Provide a description of the unit objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all resize-none"
            />
          </div>

          <button type="submit" disabled={saveMutation.isPending} className="btn-premium w-full py-3.5 text-sm font-semibold">
            {saveMutation.isPending ? 'Saving...' : 'Save Unit Record'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
