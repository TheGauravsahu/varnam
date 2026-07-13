import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft, HelpCircle, ShieldAlert } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToastStore } from '../../stores/toastStore.js';
import sound from '../../components/SoundEngine.js';
import Modal from '../../components/Modal.jsx';
import { useConfirmStore } from '../../stores/confirmStore.js';

export default function AdminExercisesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const confirm = useConfirmStore(state => state.confirm);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    lessonId: '',
    type: 'multiple_choice',
    instruction: '',
    questionText: '',
    correctAnswer: '',
    choicesText: '',
    order: '1'
  });

  // 1. Fetch Exercises
  const { data: exercisesRes, isLoading: exercisesLoading } = useQuery({
    queryKey: ['admin-exercises'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/exercises');
      return res.data;
    }
  });

  // 2. Fetch Lessons (dropdown)
  const { data: lessonsRes } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/lessons');
      return res.data;
    }
  });

  const exercisesList = exercisesRes?.data || [];
  const lessonsList = lessonsRes?.data || [];

  const getLessonName = (lesId) => {
    const les = lessonsList.find(l => l.id === parseInt(lesId));
    return les ? `Les ${les.number}: ${les.title}` : `Les #${lesId}`;
  };

  // 3. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editId) {
        const res = await axiosClient.put(`/admin/exercises/${editId}`, payload);
        return res.data;
      } else {
        const res = await axiosClient.post('/admin/exercises', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast(editId ? 'Exercise updated successfully' : 'Exercise created successfully', 'success');
      setFormOpen(false);
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to save exercise', 'error');
    }
  });

  // 4. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(`/admin/exercises/${id}`);
      return res.data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast('Exercise deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to delete exercise', 'error');
    }
  });

  const handleEdit = (ex) => {
    sound.playClick();
    setEditId(ex.id);
    
    // Format choices array/object back to input text
    let text = '';
    if (ex.type === 'matching') {
      if (Array.isArray(ex.choices)) {
        text = ex.choices.map(item => `${item.left}:${item.right}`).join('|');
      }
    } else {
      if (Array.isArray(ex.choices)) {
        text = ex.choices.join(',');
      }
    }

    setFormData({
      lessonId: ex.lessonId.toString(),
      type: ex.type,
      instruction: ex.instruction,
      questionText: ex.questionText,
      correctAnswer: ex.correctAnswer,
      choicesText: text,
      order: ex.order.toString()
    });
    setFormOpen(true);
  };

  const handleCreate = () => {
    sound.playClick();
    setEditId(null);
    const defaultLes = lessonsList[0]?.id?.toString() || '';
    setFormData({
      lessonId: defaultLes,
      type: 'multiple_choice',
      instruction: 'Select the correct translation',
      questionText: '',
      correctAnswer: '',
      choicesText: '',
      order: '1'
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    sound.playClick();
    const ok = await confirm({
      title: 'Delete Exercise?',
      message: 'Are you sure you want to delete this quiz exercise?',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    
    if (!formData.lessonId || !formData.type || !formData.questionText || !formData.correctAnswer) {
      addToast('Lesson, Type, Question, and Correct Answer are required', 'error');
      return;
    }

    // Process choicesText into correct array/object payload
    let processedChoices = [];
    if (formData.type === 'matching') {
      // Input format: left:right|left:right
      const items = formData.choicesText.split('|');
      processedChoices = items.map(item => {
        const [left, right] = item.split(':');
        return { left: (left || '').trim(), right: (right || '').trim() };
      }).filter(item => item.left && item.right);
    } else {
      // Input format: choice1,choice2,choice3
      processedChoices = formData.choicesText.split(',').map(c => c.trim()).filter(Boolean);
    }

    const payload = {
      lessonId: parseInt(formData.lessonId),
      type: formData.type,
      instruction: formData.instruction,
      questionText: formData.questionText,
      correctAnswer: formData.correctAnswer,
      choices: processedChoices,
      order: parseInt(formData.order)
    };

    saveMutation.mutate(payload);
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
              <HelpCircle className="w-8 h-8 text-pink-500" />
              <span>Quiz Exercises</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage interactive quiz matching cards, options, and items.
            </p>
          </div>
          <button onClick={handleCreate} className="btn-premium px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-none">
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {exercisesLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
        </div>
      ) : (
        <div className="border border-zinc-200/40 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold text-zinc-400 border-b border-zinc-200/30 dark:border-zinc-800/30 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-44">Lesson Goal</th>
                <th className="px-6 py-4 w-32">Type</th>
                <th className="px-6 py-4 w-48">Instruction</th>
                <th className="px-6 py-4">Question Text</th>
                <th className="px-6 py-4">Correct Answer</th>
                <th className="px-6 py-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/20 dark:divide-zinc-800/20">
              {exercisesList.map(ex => (
                <tr key={ex.id} className="text-sm hover:bg-zinc-50/40 dark:hover:bg-zinc-850/10 transition-colors">
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">
                    {getLessonName(ex.lessonId)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs uppercase font-bold tracking-wider text-pink-600 dark:text-pink-400">
                      {ex.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500 max-w-[12rem] truncate">{ex.instruction}</td>
                  <td className="px-6 py-4 font-semibold text-zinc-850 dark:text-zinc-100">{ex.questionText}</td>
                  <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">{ex.correctAnswer}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleEdit(ex)} 
                      className="text-zinc-400 hover:text-pink-500 transition-colors inline-block"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(ex.id)} 
                      className="text-zinc-400 hover:text-red-500 transition-colors inline-block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {exercisesList.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No exercises created yet. Create a new task or seed standard curriculum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Exercise Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit Quiz Exercise' : 'Create Quiz Exercise'}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Target Lesson</label>
              <select
                value={formData.lessonId}
                onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all dark:text-white"
              >
                <option value="" disabled className="text-zinc-500">Select lesson...</option>
                {lessonsList.map(les => (
                  <option key={les.id} value={les.id} className="dark:text-black">
                    Les {les.number}: {les.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Exercise Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all dark:text-white"
              >
                <option value="multiple_choice" className="dark:text-black">Multiple Choice</option>
                <option value="true_false" className="dark:text-black">True / False</option>
                <option value="fill_blank" className="dark:text-black">Fill in the Blank</option>
                <option value="matching" className="dark:text-black">Matching Columns</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Instructions</label>
              <input 
                type="text" 
                placeholder="e.g. Select the correct translation"
                value={formData.instruction}
                onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
            <div className="col-span-1 space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Order</label>
              <input 
                type="number" 
                placeholder="1"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Question Text</label>
            <input 
              type="text" 
              placeholder="e.g. Buenos días"
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Correct Answer</label>
            <input 
              type="text" 
              placeholder="e.g. Good morning"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-medium focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Choices Configuration</label>
            <textarea 
              placeholder={formData.type === 'matching' 
                ? "left:right|left:right (e.g. Dhanyavaad:Thank you|Alvida:Goodbye)" 
                : "Option1,Option2,Option3 (e.g. Good morning,Good night,Hello)"
              }
              value={formData.choicesText}
              onChange={(e) => setFormData({ ...formData, choicesText: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm font-mono focus:outline-none focus:border-pink-500 transition-all resize-none"
            />
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {formData.type === 'matching' 
                ? "For matching column type, separate pairs with a colon (:), and groups with a vertical pipe (|)." 
                : "For multiple choice or others, separate choices with simple commas (,)."
              }
            </p>
          </div>

          <button type="submit" disabled={saveMutation.isPending} className="btn-premium w-full py-3.5 text-sm font-semibold">
            {saveMutation.isPending ? 'Saving...' : 'Save Exercise Record'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
