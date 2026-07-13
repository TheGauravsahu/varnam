import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle2, Smile, Zap } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useToastStore } from '../stores/toastStore.js';
import sound from '../components/SoundEngine.js';

const TABS = [
  { key: 'hair', label: 'Hair', emoji: '💇' },
  { key: 'clothes', label: 'Clothes', emoji: '👕' },
  { key: 'pets', label: 'Pets', emoji: '🐾' },
  { key: 'backgrounds', label: 'Backgrounds', emoji: '🌅' },
  { key: 'titles', label: 'Titles', emoji: '📛' },
];

const RARITY_COLORS = {
  common: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
  uncommon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  rare: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  epic: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  legendary: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
};

const BG_STYLES = {
  '⬜': 'bg-zinc-100 dark:bg-zinc-800',
  '📚': 'bg-gradient-to-tr from-amber-950 to-zinc-900 border border-amber-500/20 text-white',
  '🌃': 'bg-gradient-to-tr from-indigo-950 to-purple-950 text-white border border-indigo-500/20',
  '🎆': 'bg-gradient-to-tr from-zinc-950 to-rose-950 text-white border border-pink-500/20',
  '🌸': 'bg-gradient-to-tr from-pink-250/10 to-rose-450/10 dark:from-pink-950 dark:to-rose-900',
  '🌊': 'bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-500/30 text-sky-400',
  '🌅': 'bg-gradient-to-tr from-amber-500/10 to-orange-600/10 border border-amber-500/30 text-orange-400',
  '🌿': 'bg-gradient-to-tr from-emerald-500/10 to-teal-600/10 dark:from-emerald-950 dark:to-teal-900',
};

const CATEGORY_MAP = {
  hair: 'hair',
  clothes: 'clothes',
  pets: 'pet',
  backgrounds: 'background',
  titles: 'title'
};

export default function AvatarPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('hair');
  const [equipped, setEquipped] = useState({ hair: null, clothes: null, pets: null, backgrounds: null, titles: null });

  // Fetch full items catalog
  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['avatar-items'],
    queryFn: async () => {
      const res = await axiosClient.get('/avatar/items');
      return res.data;
    }
  });

  // Fetch user's currently equipped avatar loadout
  const { data: equippedData, isLoading: isLoadingEquipped } = useQuery({
    queryKey: ['equipped-avatar'],
    queryFn: async () => {
      const res = await axiosClient.get('/avatar/equipped');
      return res.data;
    }
  });

  // Equip mutation
  const equipMutation = useMutation({
    mutationFn: async ({ itemId, category }) => {
      const backendCategory = CATEGORY_MAP[category];
      const res = await axiosClient.post('/avatar/equip', { itemId, category: backendCategory });
      return res.data;
    },
    onSuccess: (data, variables) => {
      sound.playLevelUp();
      addToast(data.message || 'Item equipped!', 'success');
      queryClient.invalidateQueries({ queryKey: ['equipped-avatar'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-items'] });
    },
    onError: (err) => {
      sound.playIncorrect();
      addToast(err.response?.data?.error || 'Failed to equip item', 'error');
    }
  });

  // Set equipped state from resolved loadout on change
  useEffect(() => {
    if (equippedData?.loadout) {
      const loadout = equippedData.loadout;
      setEquipped({
        hair: loadout.hair?.id || null,
        clothes: loadout.clothes?.id || null,
        pets: loadout.pet?.id || null,
        backgrounds: loadout.background?.id || null,
        titles: loadout.title?.id || null,
      });
    }
  }, [equippedData]);

  // Group flat item list into tabs
  const catalog = React.useMemo(() => {
    const list = itemsData?.items || [];
    const groups = { hair: [], clothes: [], pets: [], backgrounds: [], titles: [] };
    
    list.forEach(item => {
      const key = item.category === 'pet' ? 'pets' : 
                  item.category === 'background' ? 'backgrounds' : 
                  item.category === 'title' ? 'titles' : 
                  item.category;
      if (groups[key]) {
        groups[key].push(item);
      }
    });
    return groups;
  }, [itemsData]);

  const activeCatalog = catalog[activeTab] || [];
  
  // Resolve loadout objects
  const currentHair = equippedData?.loadout?.hair;
  const currentClothes = equippedData?.loadout?.clothes;
  const currentPet = equippedData?.loadout?.pet;
  const currentBackground = equippedData?.loadout?.background;
  const currentTitle = equippedData?.loadout?.title;

  const bgClass = currentBackground ? (BG_STYLES[currentBackground.emoji] || 'bg-zinc-100 dark:bg-zinc-800') : 'bg-zinc-100 dark:bg-zinc-800';

  if (isLoadingItems || isLoadingEquipped) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-pulse flex flex-col items-center gap-4 text-zinc-500">
          <div className="h-10 w-10 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
          <span className="text-sm font-semibold">Loading Customizer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full">
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-8">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Smile className="w-8 h-8 text-pink-500" />
          <span>Avatar Builder</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Customize your character and show off your style!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column: Preview */}
        <div className="flex flex-col items-center gap-6">
          <div className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium w-full text-center space-y-4">
            <h2 className="font-heading font-bold text-lg text-zinc-900 dark:text-zinc-100">Your Avatar Preview</h2>

            <div className={`relative mx-auto w-60 h-60 rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-500 ${bgClass}`}>
              {/* Floating avatar character layers */}
              <div className="avatar-float relative flex flex-col items-center justify-center h-full w-full">
                {/* Hair layer */}
                {currentHair && currentHair.code !== 'hair_default_black' && (
                  <span className="text-6xl absolute z-20 top-[35px]">{currentHair.emoji}</span>
                )}
                {/* Body/Clothes layer */}
                {currentClothes ? (
                  <span className="text-7xl absolute z-10 top-[70px]">{currentClothes.emoji}</span>
                ) : (
                  <span className="text-7xl absolute z-10 top-[70px]">👕</span>
                )}
                {/* Pet layer */}
                {currentPet && currentPet.code !== 'pet_none' && (
                  <span className="text-4xl absolute z-20 bottom-[40px] right-[40px]">{currentPet.emoji}</span>
                )}
              </div>
            </div>

            {/* Title badge overlay */}
            {currentTitle ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-bold shadow-sm">
                <span>{currentTitle.emoji}</span>
                <span>{currentTitle.name}</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-400 italic">No Title Equipped</span>
            )}

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-left text-xs space-y-1.5 text-zinc-500">
              <p className="flex justify-between"><span>💇 Hair:</span> <span className="font-bold text-zinc-700 dark:text-zinc-300">{currentHair?.name || 'Natural Black'}</span></p>
              <p className="flex justify-between"><span>👕 Clothes:</span> <span className="font-bold text-zinc-700 dark:text-zinc-300">{currentClothes?.name || 'Classic T-Shirt'}</span></p>
              <p className="flex justify-between"><span>🐾 Companion:</span> <span className="font-bold text-zinc-700 dark:text-zinc-300">{currentPet?.name || 'None'}</span></p>
              <p className="flex justify-between"><span>🌅 Backdrop:</span> <span className="font-bold text-zinc-700 dark:text-zinc-300">{currentBackground?.name || 'Clean White'}</span></p>
            </div>
          </div>
        </div>

        {/* Right column: Selection tabs and item list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-pink-500/30'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activeCatalog.map(item => {
              const isEquipped = equipped[activeTab] === item.id;
              return (
                <div
                  key={item.id}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-between gap-4 ${
                    isEquipped
                      ? 'border-pink-500/50 bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.1)]'
                      : item.isUnlocked
                      ? 'border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900 shadow-premium hover:border-pink-500/30'
                      : 'border-zinc-200/20 dark:border-zinc-800/20 bg-zinc-50 dark:bg-zinc-900/40'
                  }`}
                >
                  {/* Locked indicator overlay */}
                  {!item.isUnlocked && (
                    <div className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 p-3 text-center">
                      <Lock className="w-5 h-5 text-white mb-1.5" />
                      <span className="text-[10px] text-white/80 font-semibold leading-tight">{item.unlockCondition || 'Locked'}</span>
                    </div>
                  )}

                  <span className="text-5xl my-2 block">{item.emoji}</span>

                  <div className="text-center space-y-1 w-full">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{item.name}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${RARITY_COLORS[item.rarity] || ''}`}>
                      {item.rarity}
                    </span>
                  </div>

                  {item.isUnlocked && (
                    <button
                      onClick={() => !isEquipped && equipMutation.mutate({ itemId: item.id, category: activeTab })}
                      disabled={isEquipped || equipMutation.isPending}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        isEquipped
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 cursor-default font-semibold'
                          : 'btn-themed btn-themed-pink btn-premium'
                      }`}
                    >
                      {isEquipped ? <><CheckCircle2 className="w-4 h-4" /> Equipped</> : 'Equip'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
