import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft, FileText, ShieldAlert } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToastStore } from '../../stores/toastStore.js';
import { useConfirmStore } from '../../stores/confirmStore.js';
import sound from '../../components/SoundEngine.js';
import Modal from '../../components/Modal.jsx';

export default function AdminLessonsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const confirm = useConfirmStore(state => state.confirm);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ chapterId: '', number: '', title: '', xpReward: '' });

  // 1. Fetch Lessons
  const { data: lessonsRes, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/lessons');
      return res.data;
    }
  });

  // 2. Fetch Chapters (dropdown)
  const { data: chaptersRes } = useQuery({
    queryKey: ['admin-chapters'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/chapters');
      return res.data;
    }
  });

  const lessonsList = lessonsRes?.data || [];
  const chaptersList = chaptersRes?.data || [];

  const getChapterName = (chapterId) => {
    const chap = chaptersList.find(c => c.id === parseInt(chapterId));
    return chap ? `Chap ${chap.number}: ${chap.title}` : `Chap #${chapterId}`;
  };

  // 3. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editId) {
        const res = await axiosClient.put(`/admin/lessons/${editId}`, payload);
        return res.data;
      } else {
        const res = await axiosClient.post('/admin/lessons', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast(editId ? 'Lesson updated successfully' : 'Lesson created successfully', 'success');
      setFormOpen(false);
      setEditId(null);
      setFormData({ chapterId: '', number: '', title: '', xpReward: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to save lesson', 'error');
    }
  });

  // 4. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(`/admin/lessons/${id}`);
      return res.data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast('Lesson deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to delete lesson', 'error');
    }
  });

  const handleEdit = (les) => {
    sound.playClick();
    setEditId(les.id);
    setFormData({
      chapterId: les.chapterId.toString(),
      number: les.number.toString(),
      title: les.title,
      xpReward: les.xpReward.toString()
    });
    setFormOpen(true);
  };

  const handleCreate = () => {
    sound.playClick();
    setEditId(null);
    const defaultChap = chaptersList[0]?.id?.toString() || '';
    setFormData({ chapterId: defaultChap, number: '', title: '', xpReward: '15' });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    sound.playClick();
    const confirmed = await confirm({
      title: 'Delete Lesson?',
      message: 'Are you sure you want to delete this lesson? This will delete all exercises associated with it!',
      confirmText: 'Delete Lesson',
      cancelText: 'Cancel'
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    if (!formData.chapterId || !formData.number || !formData.title || !formData.xpReward) {
      addToast('All fields are required', 'error');
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
              <FileText className="w-8 h-8 text-pink-500" />
              <span>Lessons Management</span>
            </h1>
            <p className="text-xs text-zinc-555 dark:text-zinc-400">
              Create curriculum lessons and assign completion XP goals.
            </p>
          </div>
          <button onClick={handleCreate} className="btn-premium px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-none">
            <Plus className="w-4 h-4" />
            <span>Add Lesson</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {lessonsLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
        </div>
      ) : (
        <div className="border border-zinc-200/40 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold text-zinc-400 border-b border-zinc-200/30 dark:border-zinc-800/30 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-48">Chapter Segments</th>
                <th className="px-6 py-4 w-28 text-center">Lesson #</th>
                <th className="px-6 py-4">Lesson Title</th>
                <th className="px-6 py-4 w-32 text-center">XP Reward</th>
                <th className="px-6 py-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/20 dark:divide-zinc-800/20">
              {lessonsList.map(les => (
                <tr key={les.id} className="text-sm hover:bg-gradient-to-r hover:from-pink-500/10 hover:via-pink-500/5 hover:to-transparent transition-all duration-300">
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">
                    {getChapterName(les.chapterId)}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-pink-600 dark:text-pink-400">
                    {les.number}
                  </td>
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">{les.title}</td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">+{les.xpReward} XP</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleEdit(les)} 
                      className="text-zinc-400 hover:text-pink-500 transition-colors inline-block"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(les.id)} 
                      className="text-zinc-400 hover:text-red-500 transition-colors inline-block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {lessonsList.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No lessons created yet. Open chapters or seed defaults to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Lesson modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit Lesson' : 'Create Lesson'}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Target Chapter</label>
            <select
              value={formData.chapterId}
              onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all dark:text-white"
            >
              <option value="" disabled className="text-zinc-500">Select chapter...</option>
              {chaptersList.map(chap => (
                <option key={chap.id} value={chap.id} className="dark:text-black">
                  Chap {chap.number}: {chap.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Lesson #</label>
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
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">XP Reward</label>
              <input 
                type="number" 
                placeholder="15"
                min="5"
                step="5"
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Lesson Title</label>
            <input 
              type="text" 
              placeholder="e.g. Greeting with Namaste"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          <button type="submit" disabled={saveMutation.isPending} className="btn-premium w-full py-3.5 text-sm font-semibold">
            {saveMutation.isPending ? 'Saving...' : 'Save Lesson Record'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
