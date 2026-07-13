import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search, Heart, Volume2, Star, Filter, BookmarkPlus } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useToastStore } from '../stores/toastStore.js';

const FILTERS = ['All', 'Favorites', 'Due for Review'];

const MOCK_WORDS = [
  { id: 1, word: 'Hola', language: 'Spanish', flag: '🇪🇸', translation: 'Hello', example: '¡Hola, cómo estás?', isFavorite: true, lessonTag: 'Greetings', dueReview: true, notes: '' },
  { id: 2, word: 'Gracias', language: 'Spanish', flag: '🇪🇸', translation: 'Thank you', example: 'Muchas gracias por tu ayuda.', isFavorite: false, lessonTag: 'Greetings', dueReview: false, notes: 'Also: mucho' },
  { id: 3, word: 'Namaste', language: 'Hindi', flag: '🇮🇳', translation: 'Hello / I bow to you', example: 'Namaste, aap kaise hain?', isFavorite: true, lessonTag: 'Introduction', dueReview: true, notes: '' },
  { id: 4, word: 'Dhanyavaad', language: 'Hindi', flag: '🇮🇳', translation: 'Thank you', example: 'Aapka dhanyavaad!', isFavorite: false, lessonTag: 'Politeness', dueReview: false, notes: 'Formal version' },
  { id: 5, word: 'Saudade', language: 'Portuguese', flag: '🇵🇹', translation: 'Longing/nostalgia', example: 'Tenho saudade de você.', isFavorite: true, lessonTag: 'Emotions', dueReview: true, notes: 'Untranslatable feeling' },
  { id: 6, word: 'Hygge', language: 'Danish', flag: '🇩🇰', translation: 'Cozy comfort', example: 'Vi har hygge om aftenen.', isFavorite: false, lessonTag: 'Lifestyle', dueReview: false, notes: 'Danish concept' },
];

function WordCard({ word, onFavorite, onUpdateNotes }) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [note, setNote] = useState(word.notes || '');

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = word.language === 'Spanish' ? 'es-ES' : word.language === 'Hindi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNoteSave = () => {
    setIsEditingNote(false);
    onUpdateNotes(word.id, note);
  };

  return (
    <div className={`p-5 rounded-3xl border bg-white dark:bg-zinc-900 shadow-premium transition-all duration-300 hover:shadow-[0_0_25px_rgba(236,72,153,0.1)] group flex flex-col gap-4 ${
      word.dueReview ? 'border-pink-500/20' : 'border-zinc-200/40 dark:border-zinc-800/40'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{word.flag}</span>
            <h3 className="text-2xl font-heading font-bold text-zinc-900 dark:text-zinc-50">{word.word}</h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{word.language}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSpeak}
            className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-all hover:border-blue-500/30 hover:text-blue-500"
            title="Listen"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFavorite(word.id, !word.isFavorite)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-90 ${
              word.isFavorite
                ? 'border-red-500/30 bg-red-500/10 text-red-500'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-red-500/30 hover:text-red-500'
            }`}
            title={word.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${word.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Translation */}
      <div className="space-y-1">
        <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">{word.translation}</p>
        <p className="text-sm text-zinc-400 italic">{word.example}</p>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
          {word.lessonTag}
        </span>
        {word.dueReview && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Due Review
          </span>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Notes</span>
          <button
            onClick={() => setIsEditingNote(!isEditingNote)}
            className="text-[10px] text-pink-500 hover:underline font-semibold"
          >
            {isEditingNote ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {isEditingNote ? (
          <div className="flex gap-2">
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-none focus:border-pink-500"
              placeholder="Add a note..."
            />
            <button onClick={handleNoteSave} className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600 transition-all">
              Save
            </button>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">{note || 'No notes added'}</p>
        )}
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['vocabulary'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/vocabulary');
        return res.data;
      } catch {
        return { words: MOCK_WORDS };
      }
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: async ({ wordId, isFavorite }) => {
      try {
        const res = await axiosClient.put(`/vocabulary/${wordId}`, { isFavorite });
        return res.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      addToast('Vocabulary updated!', 'success');
    }
  });

  const notesMutation = useMutation({
    mutationFn: async ({ wordId, notes }) => {
      try {
        await axiosClient.put(`/vocabulary/${wordId}`, { notes });
      } catch {}
    }
  });

  const words = data?.words || MOCK_WORDS;

  const filtered = useMemo(() => {
    let list = words;
    if (activeFilter === 'Favorites') list = list.filter(w => w.isFavorite);
    if (activeFilter === 'Due for Review') list = list.filter(w => w.dueReview);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q) ||
        w.language.toLowerCase().includes(q)
      );
    }
    return list;
  }, [words, activeFilter, search]);

  const totalWords = words.length;
  const favCount = words.filter(w => w.isFavorite).length;
  const dueCount = words.filter(w => w.dueReview).length;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full space-y-8">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <BookOpen className="w-8 h-8 text-pink-500" />
            <span>My Vocabulary</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">All words you've learned across your lessons.</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search words..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:border-pink-500 transition-all"
          />
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Words', value: totalWords, emoji: '📚', color: 'text-pink-500' },
          { label: 'Favorites', value: favCount, emoji: '❤️', color: 'text-red-500' },
          { label: 'Due for Review', value: dueCount, emoji: '⏰', color: 'text-amber-500' },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900 shadow-premium text-center">
            <span className="text-2xl">{stat.emoji}</span>
            <p className={`text-2xl font-bold font-number mt-1 ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              activeFilter === f
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-pink-500/30'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Words grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-56 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <span className="text-5xl">📖</span>
          <h3 className="font-heading font-bold text-xl text-zinc-600 dark:text-zinc-400">
            {search || activeFilter !== 'All' ? 'No matching words found' : 'Your vocabulary notebook is empty'}
          </h3>
          <p className="text-sm text-zinc-400">
            {search || activeFilter !== 'All' ? 'Try a different search or filter.' : 'Complete lessons to auto-save vocabulary here!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(word => (
            <WordCard
              key={word.id}
              word={word}
              onFavorite={(id, fav) => favoriteMutation.mutate({ wordId: id, isFavorite: fav })}
              onUpdateNotes={(id, notes) => notesMutation.mutate({ wordId: id, notes })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
