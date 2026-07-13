import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, History, Zap } from 'lucide-react';
import gsap from 'gsap';
import axiosClient from '../api/axiosClient.js';
import { useToastStore } from '../stores/toastStore.js';
import sound from '../components/SoundEngine.js';

const SEGMENTS = [
  { label: '100 XP', color: '#f43f5e', textColor: '#fff', emoji: '⚡' },
  { label: '50 Coins', color: '#f59e0b', textColor: '#1a1a1a', emoji: '🪙' },
  { label: 'Streak Freeze', color: '#3b82f6', textColor: '#fff', emoji: '❄️' },
  { label: '5 Gems', color: '#8b5cf6', textColor: '#fff', emoji: '💎' },
  { label: 'Bronze Chest', color: '#b45309', textColor: '#fff', emoji: '📦' },
  { label: '200 XP', color: '#ec4899', textColor: '#fff', emoji: '🚀' },
  { label: '20 Gems', color: '#7c3aed', textColor: '#fff', emoji: '💜' },
  { label: 'Golden Chest', color: '#d97706', textColor: '#1a1a1a', emoji: '👑' },
];

const NUM_SEGMENTS = SEGMENTS.length;
const ANGLE_PER_SEG = 360 / NUM_SEGMENTS;
const SVG_SIZE = 340;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const RADIUS = 155;

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function buildSegmentPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    `Z`,
  ].join(' ');
}

function ConfettiPiece({ delay, x, color }) {
  return (
    <div
      className="confetti-piece absolute w-2 h-2 rounded-sm"
      style={{ left: `${x}%`, top: '40%', background: color, animationDelay: `${delay}s` }}
    />
  );
}

function ResultModal({ result, onClose }) {
  const confettiColors = ['#f43f5e', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899'];
  const confettiItems = Array.from({ length: 18 }, (_, i) => ({
    delay: i * 0.06,
    x: 5 + (i * 90) / 17,
    color: confettiColors[i % confettiColors.length],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-pink-500/30 shadow-[0_0_60px_rgba(236,72,153,0.2)] text-center space-y-6 overflow-hidden animate-in zoom-in duration-300">
        {confettiItems.map((c, i) => (
          <ConfettiPiece key={i} {...c} />
        ))}
        <div className="text-6xl">{result?.emoji || '🎉'}</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-zinc-900 dark:text-zinc-50">You Won!</h2>
          <p className="text-xl font-bold text-pink-500">{result?.label || 'Reward'}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Reward has been added to your account!</p>
        </div>
        <button onClick={onClose} className="btn-premium px-8 py-3 w-full">
          Awesome! 🎊
        </button>
      </div>
    </div>
  );
}

export default function SpinWheelPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const wheelGroupRef = useRef(null);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);

  // Cooldown status query
  const { data: statusData, isLoading: loadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['spin-status'],
    queryFn: async () => {
      const res = await axiosClient.get('/gamification/spin');
      return res.data;
    }
  });

  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (statusData) {
      setRemainingTime(statusData.timeUntilNextSpin || 0);
    }
  }, [statusData]);

  // Tick remainingTime down
  useEffect(() => {
    if (remainingTime <= 0) return;
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1000) {
          refetchStatus();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingTime, refetchStatus]);

  const hasSpun = statusData?.canSpin === false || remainingTime > 0;

  const formatTime = (ms) => {
    if (ms <= 0) return '';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/gamification/spin');
      return res.data;
    },
    onSuccess: (data) => {
      // Map label text to segment index
      const label = data.reward?.label || '';
      let segIdx = SEGMENTS.findIndex(s => s.label.toLowerCase() === label.toLowerCase());
      if (segIdx === -1) {
        segIdx = Math.floor(Math.random() * SEGMENTS.length);
      }
      animateWheel(segIdx);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Spin failed. Cooldown active.', 'error');
      setSpinning(false);
      refetchStatus();
    }
  });

  const animateWheel = useCallback((segIdx) => {
    if (!wheelGroupRef.current) return;

    sound.playLevelUp();

    // Segment i starts at i * ANGLE_PER_SEG, center at (i + 0.5) * ANGLE_PER_SEG
    // We want segment center at 0deg (top). rotation = -(i+0.5)*ANGLE_PER_SEG mod 360
    const targetSegCenter = (segIdx + 0.5) * ANGLE_PER_SEG;
    const extraSpins = 6 * 360; // 6 full rotations
    const finalRotation = currentRotation + extraSpins + (360 - targetSegCenter - (currentRotation % 360));

    gsap.to(wheelGroupRef.current, {
      rotation: finalRotation,
      transformOrigin: `${CX}px ${CY}px`,
      duration: 5,
      ease: 'power4.out',
      onComplete: () => {
        setCurrentRotation(finalRotation % 360);
        setSpinning(false);
        const wonSegment = SEGMENTS[segIdx];
        setResult(wonSegment);
        setTimeout(() => {
          sound.playLevelUp();
          setShowModal(true);
        }, 300);
        refetchStatus();
      }
    });
  }, [currentRotation, refetchStatus]);

  const handleSpin = () => {
    if (spinning || hasSpun) return;
    sound.playClick();
    setSpinning(true);
    spinMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/40 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 h-16 flex items-center gap-4">
        <button
          onClick={() => navigate('/gamification')}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-xl">Daily Spin Wheel</h1>
          <p className="text-xs text-zinc-500">Spin once per day to earn coins, gems, chests, and boosters!</p>
        </div>
      </header>

      {loadingStatus ? (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-pulse flex flex-col items-center gap-4 text-zinc-500">
            <div className="h-10 w-10 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
            <span className="text-sm font-semibold">Loading status...</span>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

          {/* Wheel + Spin */}
          <div className="lg:col-span-2 flex flex-col items-center gap-8">

            {/* Wheel SVG */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-xl scale-110 pointer-events-none" />

              {/* Arrow pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[26px] border-l-transparent border-r-transparent border-b-pink-500 drop-shadow-lg" />
              </div>

              <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="drop-shadow-2xl">
                <g ref={wheelGroupRef}>
                  {SEGMENTS.map((seg, i) => {
                    const startAngle = i * ANGLE_PER_SEG;
                    const endAngle = (i + 1) * ANGLE_PER_SEG;
                    const midAngle = startAngle + ANGLE_PER_SEG / 2;
                    const labelPos = polarToCartesian(CX, CY, RADIUS * 0.68, midAngle);
                    const emojiPos = polarToCartesian(CX, CY, RADIUS * 0.85, midAngle);
                    return (
                      <g key={i}>
                        <path
                          d={buildSegmentPath(CX, CY, RADIUS, startAngle, endAngle)}
                          fill={seg.color}
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="1.5"
                        />
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={seg.textColor}
                          fontSize="9.5"
                          fontWeight="700"
                          transform={`rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`}
                          style={{ fontFamily: 'Geist, sans-serif', letterSpacing: '0.02em' }}
                        >
                          {seg.label}
                        </text>
                        <text
                          x={emojiPos.x}
                          y={emojiPos.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="14"
                          transform={`rotate(${midAngle}, ${emojiPos.x}, ${emojiPos.y})`}
                        >
                          {seg.emoji}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Center hub */}
                <circle cx={CX} cy={CY} r="28" fill="#18181b" stroke="#fbbf24" strokeWidth="3" />
                <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="20">👑</text>
                <circle cx={CX} cy={CY} r={RADIUS + 4} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              </svg>
            </div>

          {/* Spin Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleSpin}
              disabled={spinning || hasSpun}
              className={`px-12 py-4 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center gap-3 select-none ${
                spinning
                  ? 'btn-premium opacity-60 cursor-not-allowed animate-pulse'
                  : hasSpun
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 cursor-not-allowed border border-zinc-300 dark:border-zinc-800'
                  : 'btn-premium hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(236,72,153,0.4)]'
              }`}
            >
              <Zap className="w-6 h-6" />
              {spinning ? 'Spinning...' : hasSpun ? 'Come Back Tomorrow!' : 'Spin the Wheel!'}
            </button>

            {hasSpun && remainingTime > 0 && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="w-4 h-4 text-pink-500" />
                <span>Next spin in: <strong className="font-number text-pink-500">{formatTime(remainingTime)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Possible rewards side panel */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-400" />
            Spin Legends
          </h3>
          <div className="space-y-3">
            {SEGMENTS.map((seg, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900 shadow-premium">
                <span className="text-2xl">{seg.emoji}</span>
                <div>
                  <p className="text-sm font-semibold">{seg.label}</p>
                  <p className="text-[10px] text-zinc-400">Available Reward segment</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Result Modal */}
      {showModal && result && (
        <ResultModal result={result} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
