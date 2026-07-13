import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft, LayoutDashboard, ShieldAlert } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToastStore } from '../../stores/toastStore.js';
import { useConfirmStore } from '../../stores/confirmStore.js';
import sound from '../../components/SoundEngine.js';
import Modal from '../../components/Modal.jsx';

export default function AdminChaptersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const confirm = useConfirmStore(state => state.confirm);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ unitId: '', number: '', title: '', description: '' });

  // 1. Fetch Chapters
  const { data: chaptersRes, isLoading: chaptersLoading } = useQuery({
    queryKey: ['admin-chapters'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/chapters');
      return res.data;
    }
  });

  // 2. Fetch Units (dropdown)
  const { data: unitsRes } = useQuery({
    queryKey: ['admin-units'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/units');
      return res.data;
    }
  });

  const chaptersList = chaptersRes?.data || [];
  const unitsList = unitsRes?.data || [];

  const getUnitName = (unitId) => {
    const unit = unitsList.find(u => u.id === parseInt(unitId));
    return unit ? `Unit ${unit.number}: ${unit.title}` : `Unit #${unitId}`;
  };

  // 3. Mutation to Save
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editId) {
        const res = await axiosClient.put(`/admin/chapters/${editId}`, payload);
        return res.data;
      } else {
        const res = await axiosClient.post('/admin/chapters', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast(editId ? 'Chapter updated successfully' : 'Chapter created successfully', 'success');
      setFormOpen(false);
      setEditId(null);
      setFormData({ unitId: '', number: '', title: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to save chapter', 'error');
    }
  });

  // 4. Mutation to Delete
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(`/admin/chapters/${id}`);
      return res.data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast('Chapter deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to delete chapter', 'error');
    }
  });

  const handleEdit = (chap) => {
    sound.playClick();
    setEditId(chap.id);
    setFormData({
      unitId: chap.unitId.toString(),
      number: chap.number.toString(),
      title: chap.title,
      description: chap.description
    });
    setFormOpen(true);
  };

  const handleCreate = () => {
    sound.playClick();
    setEditId(null);
    const defaultUnit = unitsList[0]?.id?.toString() || '';
    setFormData({ unitId: defaultUnit, number: '', title: '', description: '' });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    sound.playClick();
    const confirmed = await confirm({
      title: 'Delete Chapter?',
      message: 'Are you sure you want to delete this chapter? This will delete all lessons contained inside it!',
      confirmText: 'Delete Chapter',
      cancelText: 'Cancel'
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    if (!formData.unitId || !formData.number || !formData.title) {
      addToast('Unit, Chapter #, and Title are required', 'error');
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
              <LayoutDashboard className="w-8 h-8 text-pink-500" />
              <span>Chapters Management</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage syllabus chapters, learning segments, and milestone parameters.
            </p>
          </div>
          <button onClick={handleCreate} className="btn-premium px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-none">
            <Plus className="w-4 h-4" />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      {chaptersLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
        </div>
      ) : (
        <div className="border border-zinc-200/40 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold text-zinc-400 border-b border-zinc-200/30 dark:border-zinc-800/30 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-44">Syllabus Section</th>
                <th className="px-6 py-4 w-28 text-center">Chapter #</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 max-w-xs">Description</th>
                <th className="px-6 py-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/20 dark:divide-zinc-800/20">
              {chaptersList.map(chap => (
                <tr key={chap.id} className="text-sm hover:bg-gradient-to-r hover:from-pink-500/10 hover:via-pink-500/5 hover:to-transparent transition-all duration-300">
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">
                    {getUnitName(chap.unitId)}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-pink-600 dark:text-pink-400">
                    {chap.number}
                  </td>
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">{chap.title}</td>
                  <td className="px-6 py-4 text-xs text-zinc-500 max-w-xs truncate">{chap.description}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleEdit(chap)} 
                      className="text-zinc-400 hover:text-pink-500 transition-colors inline-block"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(chap.id)} 
                      className="text-zinc-400 hover:text-red-500 transition-colors inline-block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {chaptersList.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No curriculum chapters created yet. Open the unit manager or seed defaults.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Chapter modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit Chapter' : 'Create Chapter'}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Target Unit</label>
            <select
              value={formData.unitId}
              onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all dark:text-white"
            >
              <option value="" disabled className="text-zinc-500">Select unit...</option>
              {unitsList.map(unit => (
                <option key={unit.id} value={unit.id} className="dark:text-black">
                  Unit {unit.number}: {unit.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Chapter Number</label>
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
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Chapter Title</label>
              <input 
                type="text" 
                placeholder="e.g. Greetings & Introductions"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Description</label>
            <textarea 
              placeholder="Describe what the student will learn in this chapter..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all resize-none"
            />
          </div>

          <button type="submit" disabled={saveMutation.isPending} className="btn-premium w-full py-3.5 text-sm font-semibold">
            {saveMutation.isPending ? 'Saving...' : 'Save Chapter Record'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
