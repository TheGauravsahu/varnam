import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, Users, Search, Plus, X, Globe, Trophy, LogIn, LogOut, ArrowRight, BookOpen
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../stores/authStore.js';
import { useToastStore } from '../stores/toastStore.js';
import sound from '../components/SoundEngine.js';
import Loader from '../components/Loader.jsx';

export default function ClubsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);

  // Form states for creating a club
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubEmoji, setNewClubEmoji] = useState('🏛️');

  // Fetch all clubs
  const { data: clubsData, isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await axiosClient.get('/community/clubs');
      return res.data;
    }
  });

  // Fetch detailed info of selected club
  const { data: selectedClubDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['club-details', selectedClub?.id],
    queryFn: async () => {
      if (!selectedClub) return null;
      const res = await axiosClient.get(`/community/clubs/${selectedClub.id}`);
      return res.data;
    },
    enabled: !!selectedClub
  });

  // Create club mutation
  const createClubMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post('/community/clubs', payload);
      return res.data;
    },
    onSuccess: (data) => {
      sound.playLevelUp();
      addToast(data.message || 'Club created successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setCreateModalOpen(false);
      setNewClubName('');
      setNewClubDesc('');
      setNewClubEmoji('🏛️');
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to create club.', 'error');
    }
  });

  // Join / Leave club mutation
  const joinClubMutation = useMutation({
    mutationFn: async (clubId) => {
      const res = await axiosClient.post(`/community/clubs/${clubId}/join`);
      return res.data;
    },
    onSuccess: (data) => {
      sound.playLevelUp();
      addToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      if (selectedClub) {
        queryClient.invalidateQueries({ queryKey: ['club-details', selectedClub.id] });
      }
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to update club membership.', 'error');
    }
  });

  const handleCreateClubSubmit = (e) => {
    e.preventDefault();
    sound.playClick();
    if (!newClubName.trim()) return;
    createClubMutation.mutate({
      name: newClubName,
      description: newClubDesc,
      emoji: newClubEmoji
    });
  };

  const handleJoinLeave = (clubId) => {
    sound.playClick();
    joinClubMutation.mutate(clubId);
  };

  const clubs = clubsData?.clubs || [];
  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Building2 className="w-8 h-8 text-pink-500" />
            <span>Language Clubs</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Join groups of like-minded learners, compete together, and chat!
          </p>
        </div>

        <button 
          onClick={() => { sound.playClick(); setCreateModalOpen(true); }}
          className="btn-premium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Club</span>
        </button>
      </header>

      {/* Search and Stats bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/50 shadow-premium w-full">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search clubs by name or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none focus:border-pink-500 text-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div className="flex gap-4 ml-auto text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-pink-500" /> {clubs.length} Clubs Available</span>
        </div>
      </div>

      {/* Clubs Grid */}
      {isLoading ? (
        <Loader message="Loading language clubs..." />
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-200/40 dark:border-zinc-800/50">
          <Building2 className="w-12 h-12 text-zinc-350 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold">No clubs found.</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Be the first to create a new language club!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => {
            return (
              <div 
                key={club.id}
                className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/60 shadow-premium flex flex-col justify-between hover:shadow-premium-hover transition-all duration-350"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{club.emoji || '🏛️'}</span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold font-number bg-zinc-50 dark:bg-zinc-950/40 px-2.5 py-1 rounded-full">
                      <Users className="w-3.5 h-3.5" />
                      <span>{club.memberCount} members</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-zinc-900 dark:text-zinc-50 mt-4 leading-snug">
                    {club.name}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed min-h-[40px] line-clamp-2">
                    {club.description || 'A community of language learners.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <p className="text-zinc-400 uppercase font-bold tracking-wider text-[9px]">Weekly XP</p>
                    <p className="text-pink-600 dark:text-pink-400 font-bold font-number mt-0.5">{club.weeklyXp} XP</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { sound.playClick(); setSelectedClub(club); }}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-250 transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleJoinLeave(club.id)}
                      className="btn-premium px-4 py-2 text-xs shadow-none"
                    >
                      Toggle Join
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Club Details Modal */}
      {selectedClub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
            
            <button 
              onClick={() => setSelectedClub(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-255 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{selectedClub.emoji}</span>
                <div>
                  <h2 className="text-xl font-heading font-bold text-zinc-900 dark:text-zinc-50">{selectedClub.name}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{selectedClub.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-100 dark:border-zinc-800/50 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Members</p>
                  <p className="text-lg font-heading font-bold text-pink-600 dark:text-pink-400 font-number mt-0.5">{selectedClub.memberCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Weekly XP Combined</p>
                  <p className="text-lg font-heading font-bold text-orange-500 font-number mt-0.5">{selectedClub.weeklyXp} XP</p>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Members Leaderboard</span>
                </h4>

                {isLoadingDetails ? (
                  <Loader message="Loading club leaderboard..." />
                ) : !selectedClubDetails?.members || selectedClubDetails.members.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center">No members listed.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedClubDetails.members.map((member, index) => (
                      <div 
                        key={member.userId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/20 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-number font-bold text-zinc-400 w-4 text-center">{index + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 font-bold uppercase flex items-center justify-center">
                            {member.username.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-150">{member.username}</p>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">{member.role}</p>
                          </div>
                        </div>
                        <div className="text-right font-number">
                          <p className="font-bold text-pink-600 dark:text-pink-400">{member.xpTotal} XP</p>
                          <p className="text-[10px] text-orange-500 font-bold">{member.streakCount}d streak</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-800/50 flex gap-3">
              <button
                onClick={() => setSelectedClub(null)}
                className="btn-premium-secondary flex-1 py-2 text-xs shadow-none"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleJoinLeave(selectedClub.id);
                }}
                className="btn-premium flex-1 py-2 text-xs shadow-none"
              >
                Toggle Membership
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Club Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 max-w-md w-full p-6 shadow-2xl relative space-y-6">
            
            <button 
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-255 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-heading font-bold text-zinc-900 dark:text-zinc-50">Create a Club</h2>
              <p className="text-xs text-zinc-400 mt-1">Start a new group and build a learning club with your friends.</p>
            </div>

            <form onSubmit={handleCreateClubSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Club Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sanskrit Scholars"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none focus:border-pink-500 text-zinc-850 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Description</label>
                <textarea 
                  placeholder="What is this club about?"
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none focus:border-pink-500 text-zinc-850 dark:text-white min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Choose Emoji Logo</label>
                <select 
                  value={newClubEmoji}
                  onChange={(e) => setNewClubEmoji(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none focus:border-pink-500 text-zinc-850 dark:text-white"
                >
                  <option value="🏛️">🏛️ Temple/Academy</option>
                  <option value="🪔">🪔 Diya/Lamp</option>
                  <option value="📖">📖 Open Book</option>
                  <option value="🎨">🎨 Holi/Art</option>
                  <option value="🐉">🐉 Dragon</option>
                  <option value="👑">👑 Crown</option>
                  <option value="🔥">🔥 Fire</option>
                  <option value="🌸">🌸 Sakura/Flower</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-premium-secondary flex-1 py-3 text-sm shadow-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClubMutation.isPending}
                  className="btn-premium flex-1 py-3 text-sm shadow-none disabled:opacity-50"
                >
                  {createClubMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
