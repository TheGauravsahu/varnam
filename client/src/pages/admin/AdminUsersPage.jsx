import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Trash2, Shield, User, ShieldAlert } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToastStore } from '../../stores/toastStore.js';
import sound from '../../components/SoundEngine.js';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // 1. Fetch Users
  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/users');
      return res.data;
    }
  });

  const usersList = usersRes?.data || [];

  // 2. Change Role Mutation
  const saveMutation = useMutation({
    mutationFn: async ({ id, role }) => {
      const res = await axiosClient.put(`/admin/users/${id}`, { role });
      return res.data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast('User role updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to update role', 'error');
    }
  });

  // 3. Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosClient.delete(`/admin/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      sound.playLevelUp();
      addToast('User account deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  });

  const toggleRole = (u) => {
    sound.playClick();
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Are you sure you want to change role of ${u.username} to ${newRole}?`)) {
      saveMutation.mutate({ id: u.id, role: newRole });
    }
  };

  const handleDelete = (id) => {
    sound.playClick();
    if (window.confirm('Are you sure you want to permanently delete this user account? All progress, stats, and achievements will be lost!')) {
      deleteMutation.mutate(id);
    }
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
              <Users className="w-8 h-8 text-pink-500" />
              <span>User Directories</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage learner profiles, view registrations, and adjust authority access controls.
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
        </div>
      ) : (
        <div className="border border-zinc-200/40 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold text-zinc-400 border-b border-zinc-200/30 dark:border-zinc-800/30 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-20">ID</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4 w-36">Role</th>
                <th className="px-6 py-4 text-right w-56">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/20 dark:divide-zinc-800/20">
              {usersList.map(u => (
                <tr key={u.id} className="text-sm hover:bg-zinc-50/40 dark:hover:bg-zinc-850/10 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-zinc-400 dark:text-zinc-550">{u.id}</td>
                  <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100">{u.username}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                      u.role === 'admin' 
                        ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400' 
                        : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-350'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      <span className="capitalize">{u.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button 
                      onClick={() => toggleRole(u)} 
                      disabled={saveMutation.isPending}
                      className={`text-xs font-bold hover:underline transition-colors ${
                        u.role === 'admin' ? 'text-zinc-500 hover:text-zinc-700' : 'text-pink-600 dark:text-pink-400 hover:text-pink-500'
                      }`}
                    >
                      {u.role === 'admin' ? 'Demote to Learner' : 'Promote to Admin'}
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id)} 
                      disabled={deleteMutation.isPending}
                      className="text-zinc-400 hover:text-red-500 transition-colors inline-block align-middle"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No users registered in the database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
