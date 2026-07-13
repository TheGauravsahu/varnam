import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, RotateCcw, Layers, ArrowLeft, Trophy } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useToastStore } from '../stores/toastStore.js';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader.jsx';

const MOCK_CARDS = [
  { id: 1, word: 'Hola', language: 'Spanish', translation: 'Hello', example: '¡Hola! ¿Cómo estás?' },
  { id: 2, word: 'Gracias', language: 'Spanish', translation: 'Thank you', example: 'Muchas gracias por tu ayuda.' },
  { id: 3, word: 'Namaste', language: 'Hindi', translation: 'Hello / Greetings', example: 'Namaste, aap kaise hain?' },
  { id: 4, word: 'Saudade', language: 'Portuguese', translation: 'Nostalgic longing', example: 'Tenho saudade de você.' },
  { id: 5, word: 'Hygge', language: 'Danish', translation: 'Cozy comfort', example: 'Vi har hygge om aftenen.' },
  { id: 6, word: 'Dhanyavaad', language: 'Hindi', translation: 'Thank you', example: 'Aapka bahut dhanyavaad!' },
];

function FlashCard({ card, onRemember, onForgot, isTop }) {
  const [flipped, setFlipped] = useState(false);
  const [exitClass, setExitClass] = useState('');

  const handleRemember = () => {
    setExitClass('swipe-exit-right');
    setTimeout(() => { setFlipped(false); onRemember(card.id); }, 280);
  };

  const handleForgot = () => {
    setExitClass('swipe-exit-left');
    setTimeout(() => { setFlipped(false); onForgot(card.id); }, 280);
  };

  return (
    <div 
      className={`absolute inset-0 transition-all duration-300 ${exitClass}`} 
      style={{ zIndex: isTop ? 20 : 10 }}
    >
      <div 
        className={`w-full h-full rounded-3xl border p-8 flex flex-col items-center justify-center gap-4 transition-all duration-500 cursor-pointer ${
          flipped 
            ? 'border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-rose-500/5 dark:from-pink-500/10 dark:to-rose-500/10 shadow-[0_0_40px_rgba(236,72,153,0.15)]' 
            : 'border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900 shadow-premium'
        }`}
        onClick={() => isTop && setFlipped(f => !f)}
      >
        {!flipped ? (
          <>
            <div className="text-[10px] font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400">
              {card.language || 'Vocabulary'}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-zinc-900 dark:text-zinc-50 text-center px-4 leading-tight break-all max-w-full">
              {card.word}
            </h2>
            <p className="text-sm text-zinc-400 flex items-center gap-2 mt-4 select-none">
              <RotateCcw className="w-3.5 h-3.5" />
              Click to reveal translation
            </p>
          </>
        ) : (
          <>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Translation
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-pink-500 text-center px-4 leading-tight break-all max-w-full">
              {card.translation}
            </h2>
            <p className="text-sm text-zinc-500 italic text-center max-w-xs mt-2 leading-relaxed px-2">
              {card.exampleSentence || card.example}
            </p>
          </>
        )}
      </div>

      {/* Action buttons (only on top card, only when flipped) */}
      {isTop && flipped && (
        <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-6 z-30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={e => { e.stopPropagation(); handleForgot(); }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all active:scale-95 shadow-md shadow-red-500/5 select-none"
          >
            <XCircle className="w-5 h-5" />
            Forgot
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleRemember(); }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold text-sm hover:bg-emerald-500/20 transition-all active:scale-95 shadow-md shadow-emerald-500/5 select-none"
          >
            <CheckCircle2 className="w-5 h-5" />
            Remember
          </button>
        </div>
      )}
    </div>
  );
}

export default function FlashcardsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ remembered: 0, forgot: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const { data: flashcardsData, isLoading } = useQuery({
    queryKey: ['flashcards'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/vocabulary/flashcards');
        return res.data;
      } catch {
        return { flashcards: MOCK_CARDS };
      }
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, result }) => {
      try {
        await axiosClient.post(`/vocabulary/flashcards/${cardId}/review`, { result });
      } catch (err) {
        console.error(err);
      }
    }
  });

  const activeCards = flashcardsData?.flashcards || MOCK_CARDS;
  const remainingCards = activeCards.slice(currentIndex);
  const dueCount = activeCards.length;

  const handleRemember = (cardId) => {
    reviewMutation.mutate({ cardId, result: 'remember' });
    setSessionStats(s => ({ ...s, remembered: s.remembered + 1 }));
    advance();
  };

  const handleForgot = (cardId) => {
    reviewMutation.mutate({ cardId, result: 'forgot' });
    setSessionStats(s => ({ ...s, forgot: s.forgot + 1 }));
    advance();
  };

  const advance = () => {
    if (currentIndex + 1 >= dueCount) {
      setIsComplete(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] w-full">
        <Loader message="Loading review deck..." />
      </div>
    );
  }

  if (isComplete) {
    const total = sessionStats.remembered + sessionStats.forgot;
    const accuracy = total > 0 ? Math.round((sessionStats.remembered / total) * 100) : 0;
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors duration-300">
        <div className="w-full max-w-md p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium text-center space-y-8 animate-in zoom-in duration-300">
          <div className="space-y-3">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50">Session Complete!</h2>
            <p className="text-sm text-zinc-500">Great job reviewing your vocabulary today.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Reviewed', value: total, color: 'text-pink-500', emoji: '📚' },
              { label: 'Remembered', value: sessionStats.remembered, color: 'text-emerald-500', emoji: '✅' },
              { label: 'Accuracy', value: `${accuracy}%`, color: 'text-blue-500', emoji: '🎯' },
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-950/20">
                <div className="text-xl mb-1">{stat.emoji}</div>
                <div className={`text-xl font-bold font-number ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setCurrentIndex(0); setIsComplete(false); setSessionStats({ remembered: 0, forgot: 0 }); }}
              className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-655 dark:text-zinc-300"
            >
              Restart
            </button>
            <button
              onClick={() => navigate('/vocabulary')}
              className="flex-1 btn-premium py-3 text-sm"
            >
              View Notebook
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Layers className="w-7 h-7 text-pink-500" />
            Flashcards
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{dueCount - currentIndex} cards remaining today</p>
        </div>
        {/* Session progress */}
        <div className="text-right">
          <p className="text-xs font-bold text-zinc-400 font-number">{currentIndex} / {dueCount}</p>
          <div className="w-32 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentIndex / dueCount) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Session stats mini */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold select-none">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {sessionStats.remembered} remembered
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold select-none">
          <XCircle className="w-3.5 h-3.5" />
          {sessionStats.forgot} forgotten
        </div>
      </div>

      {/* Card stack */}
      <div className="relative" style={{ height: '280px' }}>
        {/* Background cards (stacked effect) */}
        {remainingCards.slice(1, 3).map((card, stackIdx) => (
          <div
            key={card.id}
            className="absolute inset-0 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900"
            style={{
              transform: `translateY(${(stackIdx + 1) * 8}px) scale(${1 - (stackIdx + 1) * 0.04})`,
              zIndex: 10 - stackIdx,
            }}
          />
        ))}

        {/* Top card */}
        {remainingCards.length > 0 && (
          <FlashCard
            key={remainingCards[0].id}
            card={remainingCards[0]}
            isTop={true}
            onRemember={handleRemember}
            onForgot={handleForgot}
          />
        )}
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-zinc-400 mt-20 select-none">Click the card to flip, then mark Remember or Forgot</p>
    </div>
  );
}
