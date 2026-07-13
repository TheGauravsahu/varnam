import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Gamepad2, Gift, CheckCircle2, Clock, Sparkles, RefreshCw,
  ChevronRight, Star, Trophy, Zap, Coins, Package, Lock,
  CalendarDays, Flame
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useToastStore } from '../stores/toastStore.js';
import gsap from 'gsap';

/* ── Mock seasonal events ── */
const SEASONAL_EVENTS = [
  { id: 1, name: 'Diwali Festival', emoji: '🪔', gradient: 'from-amber-500 to-orange-600', progress: 4, required: 10, collectibles: 2, active: true },
  { id: 2, name: 'Holi Splash', emoji: '🎨', gradient: 'from-pink-500 via-purple-500 to-cyan-500', progress: 0, required: 8, collectibles: 0, active: false, upcoming: true },
  { id: 3, name: 'Independence Day', emoji: '🇮🇳', gradient: 'from-orange-500 via-white to-green-500', progress: 7, required: 7, collectibles: 3, active: true },
  { id: 4, name: 'Christmas Magic', emoji: '🎄', gradient: 'from-red-600 to-green-700', progress: 2, required: 12, collectibles: 1, active: true },
  { id: 5, name: 'New Year Blast', emoji: '🎆', gradient: 'from-purple-600 to-yellow-500', progress: 0, required: 5, collectibles: 0, active: false, upcoming: true },
];

const CHEST_TYPES = [
  { id: 'bronze', label: 'Bronze Chest', emoji: '📦', rarity: 'Common', color: 'from-amber-700 to-amber-500', border: 'border-amber-600/30', count: 2, reward: '50-100 XP or 10-20 Coins' },
  { id: 'silver', label: 'Silver Chest', emoji: '🗝️', rarity: 'Uncommon', color: 'from-zinc-400 to-zinc-300', border: 'border-zinc-400/40', count: 1, reward: '100-200 XP or 2 Gems' },
  { id: 'gold', label: 'Gold Chest', emoji: '💰', rarity: 'Rare', color: 'from-yellow-500 to-yellow-300', border: 'border-yellow-500/40', count: 1, reward: '200-400 XP or 5 Gems' },
  { id: 'golden', label: 'Golden Chest', emoji: '👑', rarity: 'Legendary', color: 'from-yellow-400 via-amber-400 to-orange-400', border: 'border-yellow-400/50', count: 0, reward: '500 XP + Rare Avatar Item' },
];

function useCountdown(targetHour = 24) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(targetHour, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = target - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetHour]);
  return timeLeft;
}

function QuestCard({ quest, onClaim }) {
  const pct = Math.min(100, (quest.progress / quest.target) * 100);
  const isComplete = quest.progress >= quest.target;
  const isClaimed = quest.claimed;
  return (
    <div className="p-5 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium flex flex-col gap-4 hover:border-pink-500/30 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{quest.icon}</div>
          <div>
            <h3 className="font-heading font-bold text-sm text-zinc-800 dark:text-zinc-100">{quest.title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{quest.description}</p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-0.5 font-number">+{quest.xpReward} XP</span>
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 font-number">{quest.coinReward} coins</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-semibold text-zinc-400 font-number">
          <span>{quest.progress} / {quest.target}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-pink-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button
        onClick={() => !isClaimed && isComplete && onClaim(quest.id)}
        disabled={!isComplete || isClaimed}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
          isClaimed
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 cursor-default'
            : isComplete
            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
        }`}
      >
        {isClaimed ? (
          <><CheckCircle2 className="w-4 h-4" /> Claimed!</>
        ) : isComplete ? (
          <><Gift className="w-4 h-4" /> Claim Reward</>
        ) : (
          <><Lock className="w-3.5 h-3.5" /> Complete Quest</>
        )}
      </button>
    </div>
  );
}

function ChestCard({ chest, onOpen }) {
  const [shaking, setShaking] = useState(false);
  const handleOpen = () => {
    if (chest.count === 0) return;
    setShaking(true);
    setTimeout(() => { setShaking(false); onOpen(chest.id); }, 400);
  };
  return (
    <div className={`p-5 rounded-3xl border ${chest.border} bg-white dark:bg-zinc-900 shadow-premium flex flex-col items-center gap-3 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] transition-all duration-300`}>
      <div className={`text-5xl ${shaking ? 'chest-shake' : ''}`}>{chest.emoji}</div>
      <div className="text-center">
        <h3 className="font-heading font-bold text-sm">{chest.label}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          chest.rarity === 'Legendary' ? 'bg-yellow-500/10 text-yellow-500' :
          chest.rarity === 'Rare' ? 'bg-purple-500/10 text-purple-500' :
          chest.rarity === 'Uncommon' ? 'bg-blue-500/10 text-blue-500' :
          'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
        }`}>{chest.rarity}</span>
      </div>
      <p className="text-[10px] text-zinc-400 text-center">{chest.reward}</p>
      <div className="text-xs font-bold font-number text-zinc-500">You have: {chest.count}</div>
      <button
        onClick={handleOpen}
        disabled={chest.count === 0}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
          chest.count > 0 ? 'btn-premium' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
        }`}
      >
        {chest.count > 0 ? 'Open Chest' : 'None Available'}
      </button>
    </div>
  );
}

export default function GamificationPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const timeLeft = useCountdown(24);
  const headerRef = useRef(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
    }
  }, []);

  const { data: questsData, isLoading: questsLoading } = useQuery({
    queryKey: ['daily-quests'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/gamification/quests');
        return res.data;
      } catch {
        return {
          quests: [
            { id: 1, icon: '📚', title: 'Complete 3 Lessons', description: 'Finish any 3 lessons today', progress: 2, target: 3, xpReward: 50, coinReward: 25, claimed: false },
            { id: 2, icon: '🔥', title: '5-Day Streak', description: 'Maintain your daily streak for 5 days', progress: 3, target: 5, xpReward: 100, coinReward: 50, claimed: false },
            { id: 3, icon: '⚡', title: 'Perfect Score', description: 'Get 100% on any lesson', progress: 1, target: 1, xpReward: 75, coinReward: 30, claimed: false },
          ]
        };
      }
    }
  });

  const { data: weeklyData } = useQuery({
    queryKey: ['weekly-mission'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/gamification/missions');
        return res.data;
      } catch {
        return { xpEarned: 840, xpTarget: 1500, claimed: false };
      }
    }
  });

  const claimQuestMutation = useMutation({
    mutationFn: async (questId) => {
      const res = await axiosClient.post(`/gamification/quests/${questId}/claim`);
      return res.data;
    },
    onSuccess: (data) => {
      addToast(`Quest claimed! +${data?.xpReward || 50} XP`, 'success');
      queryClient.invalidateQueries({ queryKey: ['daily-quests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      addToast(err?.response?.data?.error || 'Failed to claim quest', 'error');
    }
  });

  const openChestMutation = useMutation({
    mutationFn: async (chestId) => {
      const res = await axiosClient.post(`/gamification/chests/${chestId}/open`);
      return res.data;
    },
    onSuccess: (data) => {
      addToast(`You received: ${data?.reward || '100 XP'}!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      addToast('No chests to open or server error!', 'error');
    }
  });

  const quests = questsData?.quests || [];
  const weekly = weeklyData || { xpEarned: 0, xpTarget: 1500, claimed: false };
  const weeklyPct = Math.min(100, (weekly.xpEarned / weekly.xpTarget) * 100);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full space-y-10">

      {/* Header */}
      <header ref={headerRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Gamepad2 className="w-8 h-8 text-pink-500" />
            <span>Gamification Hub</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Complete quests, open chests, and earn epic rewards!</p>
        </div>
        <Link to="/spin" className="btn-premium px-5 py-3 text-sm flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>Spin the Wheel</span>
        </Link>
      </header>

      {/* Daily Quests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-pink-500" />
            Daily Quests
          </h2>
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Resets in {timeLeft}
          </span>
        </div>

        {questsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quests.map(quest => (
              <QuestCard key={quest.id} quest={quest} onClaim={(id) => claimQuestMutation.mutate(id)} />
            ))}
          </div>
        )}
      </section>

      {/* Weekly Mission */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Weekly Mission
        </h2>
        <div className="p-6 rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 shadow-premium relative overflow-hidden">
          <div className="absolute -right-8 -top-8 text-9xl opacity-10 pointer-events-none select-none">🏆</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-2xl">🗝️</div>
                <div>
                  <h3 className="font-heading font-bold text-lg">Earn 1,500 XP This Week</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Complete lessons and quests to earn weekly XP</p>
                </div>
              </div>
              <div className="space-y-1.5 w-full">
                <div className="flex justify-between text-xs font-semibold font-number text-zinc-500">
                  <span>{weekly.xpEarned} XP earned</span>
                  <span>{weekly.xpTarget} XP goal</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${weeklyPct}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="text-4xl">🎁</div>
              <p className="text-[10px] text-zinc-400 font-semibold">Golden Chest</p>
              <button
                disabled={weeklyPct < 100 || weekly.claimed}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  weekly.claimed ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  weeklyPct >= 100 ? 'bg-yellow-500 text-black hover:bg-yellow-400' :
                  'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {weekly.claimed ? 'Claimed' : weeklyPct >= 100 ? 'Claim Chest' : `${Math.round(weeklyPct)}% Done`}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seasonal Events */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Seasonal Events
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {SEASONAL_EVENTS.map(event => {
            const pct = Math.min(100, (event.progress / event.required) * 100);
            return (
              <div
                key={event.id}
                className={`shrink-0 w-64 rounded-3xl overflow-hidden border shadow-premium relative ${
                  event.active ? 'border-pink-500/30' : 'border-zinc-200/40 dark:border-zinc-800/40'
                }`}
              >
                <div className={`h-24 bg-gradient-to-br ${event.gradient} flex items-center justify-center relative`}>
                  <span className="text-5xl">{event.emoji}</span>
                  <div className="absolute top-2 right-2">
                    {event.active && !event.upcoming && (
                      <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Active</span>
                    )}
                    {event.upcoming && (
                      <span className="text-[10px] font-bold bg-black/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Upcoming</span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 space-y-3">
                  <h3 className="font-heading font-bold text-sm">{event.name}</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400 font-number">
                      <span>{event.progress}/{event.required} lessons</span>
                      <span>{event.collectibles} collectibles</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${event.gradient} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span>{event.collectibles} items earned</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Treasure Chests */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          Treasure Chests
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CHEST_TYPES.map(chest => (
            <ChestCard key={chest.id} chest={chest} onOpen={(id) => openChestMutation.mutate(id)} />
          ))}
        </div>
      </section>

      {/* Spin Wheel Teaser */}
      <section>
        <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-blue-500/10 border border-pink-500/20 flex flex-col sm:flex-row items-center gap-6 shadow-premium relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.08),transparent)] pointer-events-none" />
          <div className="text-7xl animate-bounce">🎡</div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-heading font-bold text-zinc-900 dark:text-zinc-50">Spin Daily for Rewards!</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Win XP, Gems, Coins, Chests, and Streak Freezes every day!</p>
            <div className="flex items-center gap-2 mt-3 text-sm text-zinc-500 justify-center sm:justify-start">
              <Clock className="w-4 h-4 text-pink-500" />
              <span>Next spin in: <strong className="font-number text-pink-500">{timeLeft}</strong></span>
            </div>
          </div>
          <Link to="/spin" className="btn-premium px-8 py-4 text-base flex items-center gap-2 shrink-0">
            <Zap className="w-5 h-5" />
            Spin Now!
          </Link>
        </div>
      </section>
    </div>
  );
}
