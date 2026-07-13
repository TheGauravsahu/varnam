import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft, Gamepad2, Check, X, ShieldAlert } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToastStore } from '../../stores/toastStore.js';
import { useConfirmStore } from '../../stores/confirmStore.js';
import sound from '../../components/SoundEngine.js';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';

const TABS = [
  { key: 'quests', label: 'Daily Quests', emoji: '📋' },
  { key: 'missions', label: 'Weekly Missions', emoji: '🎯' },
  { key: 'events', label: 'Seasonal Events', emoji: '🎉' },
  { key: 'avatar-items', label: 'Avatar Items', emoji: '👤' },
];

export default function AdminGamificationPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const confirm = useConfirmStore(state => state.confirm);

  const [activeTab, setActiveTab] = useState('quests');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form states for all models
  const [questForm, setQuestForm] = useState({ code: '', title: '', description: '', icon: 'target', xpReward: 50, coinReward: 20, targetCount: 1, questType: 'lesson', isActive: true });
  const [missionForm, setMissionForm] = useState({ code: '', title: '', description: '', xpRequired: 1500, reward: '{"type": "golden_chest", "xp": 500, "coins": 200}', isActive: true });
  const [eventForm, setEventForm] = useState({ code: '', name: '', description: '', emoji: '🎉', themeColor: 'from-pink-500 to-rose-500', startDate: '', endDate: '', lessonsRequired: 5, rewardItem: '', isActive: true });
  const [itemForm, setItemForm] = useState({ code: '', name: '', category: 'hair', imageUrl: '', emoji: '🎀', rarity: 'common', unlockCondition: '', unlockType: 'achievement', coinCost: 0, isDefault: false, sortOrder: 0 });

  // 1. Fetching queries
  const { data: questsRes, isLoading: loadingQuests } = useQuery({
    queryKey: ['admin-quests'],
    queryFn: async () => (await axiosClient.get('/admin/quests')).data,
    enabled: activeTab === 'quests'
  });

  const { data: missionsRes, isLoading: loadingMissions } = useQuery({
    queryKey: ['admin-missions'],
    queryFn: async () => (await axiosClient.get('/admin/missions')).data,
    enabled: activeTab === 'missions'
  });

  const { data: eventsRes, isLoading: loadingEvents } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => (await axiosClient.get('/admin/events')).data,
    enabled: activeTab === 'events'
  });

  const { data: itemsRes, isLoading: loadingItems } = useQuery({
    queryKey: ['admin-avatar-items'],
    queryFn: async () => (await axiosClient.get('/admin/avatar-items')).data,
    enabled: activeTab === 'avatar-items'
  });

  // 2. Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = `/admin/${activeTab === 'avatar-items' ? 'avatar-items' : activeTab}`;
      if (editId) {
        return (await axiosClient.put(`${endpoint}/${editId}`, payload)).data;
      } else {
        return (await axiosClient.post(endpoint, payload)).data;
      }
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast(editId ? 'Record updated successfully' : 'Record created successfully', 'success');
      setFormOpen(false);
      setEditId(null);
      resetForms();
      queryClient.invalidateQueries({ queryKey: [`admin-${activeTab}`] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to save changes', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const endpoint = `/admin/${activeTab === 'avatar-items' ? 'avatar-items' : activeTab}`;
      return (await axiosClient.delete(`${endpoint}/${id}`)).data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast('Record deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: [`admin-${activeTab}`] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to delete record', 'error');
    }
  });

  const resetForms = () => {
    setQuestForm({ code: '', title: '', description: '', icon: 'target', xpReward: 50, coinReward: 20, targetCount: 1, questType: 'lesson', isActive: true });
    setMissionForm({ code: '', title: '', description: '', xpRequired: 1500, reward: '{"type": "golden_chest", "xp": 500, "coins": 200}', isActive: true });
    setEventForm({ code: '', name: '', description: '', emoji: '🎉', themeColor: 'from-pink-500 to-rose-500', startDate: '', endDate: '', lessonsRequired: 5, rewardItem: '', isActive: true });
    setItemForm({ code: '', name: '', category: 'hair', imageUrl: '', emoji: '🎀', rarity: 'common', unlockCondition: '', unlockType: 'achievement', coinCost: 0, isDefault: false, sortOrder: 0 });
  };

  const handleEdit = (record) => {
    sound.playClick();
    setEditId(record.id);
    if (activeTab === 'quests') {
      setQuestForm({ ...record });
    } else if (activeTab === 'missions') {
      setMissionForm({ ...record, reward: JSON.stringify(record.reward, null, 2) });
    } else if (activeTab === 'events') {
      setEventForm({
        ...record,
        startDate: record.startDate ? record.startDate.slice(0, 10) : '',
        endDate: record.endDate ? record.endDate.slice(0, 10) : '',
      });
    } else if (activeTab === 'avatar-items') {
      setItemForm({ ...record });
    }
    setFormOpen(true);
  };

  const handleCreate = () => {
    sound.playClick();
    setEditId(null);
    resetForms();
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    sound.playClick();
    const ok = await confirm({
      title: 'Delete Record?',
      message: 'Are you sure you want to permanently delete this gamification config? Active user progress maps may fail.',
      confirmText: 'Delete Now',
      cancelText: 'Cancel'
    });
    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    let payload = {};
    if (activeTab === 'quests') payload = questForm;
    else if (activeTab === 'missions') payload = missionForm;
    else if (activeTab === 'events') payload = eventForm;
    else if (activeTab === 'avatar-items') payload = itemForm;

    saveMutation.mutate(payload);
  };

  const isLoading = loadingQuests || loadingMissions || loadingEvents || loadingItems;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link 
          to="/admin" 
          onClick={() => sound.playClick()}
          className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-pink-500 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Panel</span>
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Gamepad2 className="w-8 h-8 text-pink-500" />
              <span>Gamification Configs</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage Daily Quests, Weekly Missions, Seasonal Events, and Avatar Catalog assets.</p>
          </div>
          <button 
            onClick={handleCreate} 
            className="btn-premium flex items-center gap-1.5 shadow-lg shadow-pink-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-zinc-200/40 dark:border-zinc-800/40" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              sound.playClick();
              setActiveTab(tab.key);
              setFormOpen(false);
              setEditId(null);
            }}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all relative ${
              activeTab === tab.key
                ? 'text-pink-650 dark:text-pink-400 font-bold border-b-2 border-pink-500'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main List Table */}
      <div className="rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium overflow-hidden">
        {isLoading ? (
          <div className="py-20"><Loader message="Fetching configurations..." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-bold">
                  {activeTab === 'quests' && (
                    <>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Rewards</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'missions' && (
                    <>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">XP Required</th>
                      <th className="px-6 py-4">Reward Box</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'events' && (
                    <>
                      <th className="px-6 py-4">Emoji</th>
                      <th className="px-6 py-4">Event Name</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Lessons Target</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'avatar-items' && (
                    <>
                      <th className="px-6 py-4">Emoji</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Rarity</th>
                      <th className="px-6 py-4 text-center">Default</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {activeTab === 'quests' && (questsRes?.data || []).map(record => (
                  <tr key={record.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    <td className="px-6 py-4 font-mono text-xs">{record.code}</td>
                    <td className="px-6 py-4 font-semibold">{record.title}</td>
                    <td className="px-6 py-4 capitalize">{record.questType}</td>
                    <td className="px-6 py-4 text-xs font-bold text-pink-600 dark:text-pink-400">+{record.xpReward} XP, +{record.coinReward} C</td>
                    <td className="px-6 py-4 text-center">
                      {record.isActive ? <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">Active</span> : <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">Disabled</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(record)} className="p-1.5 text-zinc-500 hover:text-pink-500 rounded-lg hover:bg-pink-50/20"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-zinc-550 hover:text-red-500 rounded-lg hover:bg-red-50/20"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'missions' && (missionsRes?.data || []).map(record => (
                  <tr key={record.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    <td className="px-6 py-4 font-mono text-xs">{record.code}</td>
                    <td className="px-6 py-4 font-semibold">{record.title}</td>
                    <td className="px-6 py-4 font-bold">{record.xpRequired} XP</td>
                    <td className="px-6 py-4 text-xs font-mono">{JSON.stringify(record.reward)}</td>
                    <td className="px-6 py-4 text-center">
                      {record.isActive ? <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">Active</span> : <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">Disabled</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(record)} className="p-1.5 text-zinc-500 hover:text-pink-500 rounded-lg hover:bg-pink-50/20"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-zinc-550 hover:text-red-500 rounded-lg hover:bg-red-50/20"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'events' && (eventsRes?.data || []).map(record => (
                  <tr key={record.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    <td className="px-6 py-4 text-2xl">{record.emoji}</td>
                    <td className="px-6 py-4 font-semibold">{record.name}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{record.startDate?.slice(0, 10)} to {record.endDate?.slice(0, 10)}</td>
                    <td className="px-6 py-4">{record.lessonsRequired} Lessons</td>
                    <td className="px-6 py-4 text-center">
                      {record.isActive ? <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">Active</span> : <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">Disabled</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(record)} className="p-1.5 text-zinc-500 hover:text-pink-500 rounded-lg hover:bg-pink-50/20"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-zinc-550 hover:text-red-500 rounded-lg hover:bg-red-50/20"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'avatar-items' && (itemsRes?.data || []).map(record => (
                  <tr key={record.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    <td className="px-6 py-4 text-3xl">{record.emoji}</td>
                    <td className="px-6 py-4 font-semibold">{record.name}</td>
                    <td className="px-6 py-4 capitalize font-mono text-xs">{record.category}</td>
                    <td className="px-6 py-4 capitalize font-bold text-xs text-purple-600 dark:text-purple-400">{record.rarity}</td>
                    <td className="px-6 py-4 text-center">
                      {record.isDefault ? <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-650">Default</span> : <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">Locked</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(record)} className="p-1.5 text-zinc-500 hover:text-pink-500 rounded-lg hover:bg-pink-50/20"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-zinc-550 hover:text-red-500 rounded-lg hover:bg-red-50/20"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Editor Form */}
      {formOpen && (
        <Modal 
          isOpen={formOpen} 
          title={editId ? `Edit ${TABS.find(t => t.key === activeTab)?.label}` : `Create ${TABS.find(t => t.key === activeTab)?.label}`}
          onClose={() => setFormOpen(false)}
        >
          <form onSubmit={onSubmit} className="space-y-4">
            
            {activeTab === 'quests' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Code</label>
                  <input type="text" value={questForm.code} onChange={e => setQuestForm({...questForm, code: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Title</label>
                  <input type="text" value={questForm.title} onChange={e => setQuestForm({...questForm, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Description</label>
                  <textarea value={questForm.description} onChange={e => setQuestForm({...questForm, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" rows={2} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">XP Reward</label>
                    <input type="number" value={questForm.xpReward} onChange={e => setQuestForm({...questForm, xpReward: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Coins Reward</label>
                    <input type="number" value={questForm.coinReward} onChange={e => setQuestForm({...questForm, coinReward: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Target Count</label>
                    <input type="number" value={questForm.targetCount} onChange={e => setQuestForm({...questForm, targetCount: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Quest Type</label>
                    <select value={questForm.questType} onChange={e => setQuestForm({...questForm, questType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none">
                      <option value="lesson">Lessons Completed</option>
                      <option value="xp">XP Gained</option>
                      <option value="word">Words Practice</option>
                      <option value="streak">Streak Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" checked={questForm.isActive} onChange={e => setQuestForm({...questForm, isActive: e.target.checked})} id="q_active" />
                  <label htmlFor="q_active" className="text-sm font-semibold select-none">Quest Active & Available</label>
                </div>
              </>
            )}

            {activeTab === 'missions' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Code</label>
                  <input type="text" value={missionForm.code} onChange={e => setMissionForm({...missionForm, code: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Title</label>
                  <input type="text" value={missionForm.title} onChange={e => setMissionForm({...missionForm, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Description</label>
                  <textarea value={missionForm.description} onChange={e => setMissionForm({...missionForm, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" rows={2} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">XP Target Required</label>
                  <input type="number" value={missionForm.xpRequired} onChange={e => setMissionForm({...missionForm, xpRequired: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Reward Payload (JSON String)</label>
                  <textarea value={missionForm.reward} onChange={e => setMissionForm({...missionForm, reward: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none font-mono text-xs" rows={3} required />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" checked={missionForm.isActive} onChange={e => setMissionForm({...missionForm, isActive: e.target.checked})} id="m_active" />
                  <label htmlFor="m_active" className="text-sm font-semibold select-none">Mission Active & Available</label>
                </div>
              </>
            )}

            {activeTab === 'events' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Code</label>
                    <input type="text" value={eventForm.code} onChange={e => setEventForm({...eventForm, code: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Emoji Icon</label>
                    <input type="text" value={eventForm.emoji} onChange={e => setEventForm({...eventForm, emoji: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Event Name</label>
                  <input type="text" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Description</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" rows={2} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Start Date</label>
                    <input type="date" value={eventForm.startDate} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">End Date</label>
                    <input type="date" value={eventForm.endDate} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Lessons Target</label>
                    <input type="number" value={eventForm.lessonsRequired} onChange={e => setEventForm({...eventForm, lessonsRequired: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Reward Cosmetic ID</label>
                    <input type="text" value={eventForm.rewardItem} onChange={e => setEventForm({...eventForm, rewardItem: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" placeholder="e.g. hair_ponytail" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" checked={eventForm.isActive} onChange={e => setEventForm({...eventForm, isActive: e.target.checked})} id="e_active" />
                  <label htmlFor="e_active" className="text-sm font-semibold select-none">Event Active & Available</label>
                </div>
              </>
            )}

            {activeTab === 'avatar-items' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Code</label>
                    <input type="text" value={itemForm.code} onChange={e => setItemForm({...itemForm, code: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Emoji Avatar</label>
                    <input type="text" value={itemForm.emoji} onChange={e => setItemForm({...itemForm, emoji: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Item Name</label>
                  <input type="text" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-pink-500" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Slot Category</label>
                    <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none">
                      <option value="hair">Hair (💇)</option>
                      <option value="clothes">Clothes (👕)</option>
                      <option value="pet">Companion Pet (🐾)</option>
                      <option value="background">Background (🌅)</option>
                      <option value="title">Title Title (📛)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Rarity Class</label>
                    <select value={itemForm.rarity} onChange={e => setItemForm({...itemForm, rarity: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none">
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Coin Cost</label>
                    <input type="number" value={itemForm.coinCost} onChange={e => setItemForm({...itemForm, coinCost: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Unlock Type</label>
                    <select value={itemForm.unlockType} onChange={e => setItemForm({...itemForm, unlockType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none">
                      <option value="achievement">Achievement Unlock</option>
                      <option value="purchase">Store Purchase</option>
                      <option value="spin">Spin Wheel Prize</option>
                      <option value="event">Seasonal Event</option>
                      <option value="default">Default Starter</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Unlock Condition Description</label>
                  <input type="text" value={itemForm.unlockCondition} onChange={e => setItemForm({...itemForm, unlockCondition: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none" placeholder="e.g. Reach Gold League" required />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" checked={itemForm.isDefault} onChange={e => setItemForm({...itemForm, isDefault: e.target.checked})} id="it_default" />
                  <label htmlFor="it_default" className="text-sm font-semibold select-none">Starter item (available by default)</label>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <button 
                type="button" 
                onClick={() => setFormOpen(false)} 
                className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saveMutation.isPending}
                className="btn-premium px-5 py-2.5 text-xs font-bold shadow-lg shadow-pink-500/25 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
}
