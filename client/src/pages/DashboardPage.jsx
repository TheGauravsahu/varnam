import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Coins,
  Gem,
  Crown,
  Play,
  Lock,
  ChevronDown,
  Calendar,
  Award,
  ClipboardX,
} from "lucide-react";
import axiosClient from "../api/axiosClient.js";
import sound from "../components/SoundEngine.js";
import Modal from "../components/Modal.jsx";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch Dashboard dataset
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await axiosClient.get("/dashboard");
      return res.data;
    },
  });

  // Language selection mutation
  const selectLanguageMutation = useMutation({
    mutationFn: async (languageId) => {
      const res = await axiosClient.post("/dashboard/select-language", {
        languageId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setLangDropdownOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 border border-red-500/20 bg-red-500/10 rounded-2xl text-center space-y-4">
        <p className="text-red-500 font-semibold">
          Error loading dashboard: {error.message}
        </p>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
          }
          className="btn-premium px-6 py-2.5 text-sm"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const {
    currentLanguage,
    activeLanguages,
    units = [],
    completedLessons = [],
    nextLesson,
    achievements = [],
    dailyGoalXp,
    currentXp,
  } = data || {};

  const completedSet = new Set(completedLessons);

  const handleLangSelect = (id) => {
    sound.playClick();
    selectLanguageMutation.mutate(id);
  };

  const handleLessonClick = (lesson) => {
    const isUnlocked =
      completedSet.has(lesson.id) ||
      !nextLesson ||
      lesson.id === nextLesson.id ||
      lesson.number === 1 ||
      completedSet.has(lesson.id - 1); // fallback lock logic

    if (!isUnlocked) {
      sound.playIncorrect(); // play lock thud
      return;
    }

    sound.playClick();
    setSelectedLesson(lesson);
    setModalOpen(true);
  };

  const startLesson = () => {
    sound.playClick();
    setModalOpen(false);
    navigate(`/lessons/${selectedLesson.id}`);
  };

  // Progress percentage computations
  const progressPercent = Math.min((currentXp / dailyGoalXp) * 100, 100);

  // Compute user level metrics (local client fallback in case middleware is loading)
  const xpTotal = data?.user?.profile?.xpTotal || currentXp || 0;

  // Custom simple level math
  let userLevel = 1;
  let nextLevelXp = 100;
  let remainingXp = xpTotal;
  while (remainingXp >= nextLevelXp) {
    remainingXp -= nextLevelXp;
    userLevel += 1;
    nextLevelXp += 100;
  }
  const levelProgressPercent = Math.min(
    100,
    Math.floor((remainingXp / nextLevelXp) * 100),
  );

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto w-full space-y-8">
      {/* 1. Dashboard Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <span>नमस्ते, {data?.user?.username || "Learner"}!</span>
            <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Keep up the momentum. What should we learn today?
          </p>
        </div>

        {/* Stats Pill Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setLangDropdownOpen(!langDropdownOpen);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all focus:outline-none"
            >
              <span className="text-lg">{currentLanguage?.flagEmoji}</span>
              <span>{currentLanguage?.name}</span>
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>

            {langDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-premium py-2 z-50 space-y-1">
                {activeLanguages?.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLangSelect(lang.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3 transition-colors ${
                      lang.id === currentLanguage?.id
                        ? "text-pink-600 dark:text-pink-400 bg-pink-500/5"
                        : "text-zinc-700 dark:text-zinc-350"
                    }`}
                  >
                    <span className="text-lg">{lang.flagEmoji}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 font-semibold text-sm">
            <Flame className="w-4 h-4 fill-current" />
            <span className="font-number">
              {data?.user?.profile?.streakCount || 0} Day Streak
            </span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-semibold text-sm">
            <Coins className="w-4 h-4 fill-current" />
            <span className="font-number">
              {data?.user?.profile?.coins || 0} Coins
            </span>
          </div>

          {/* Diamonds */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 font-semibold text-sm">
            <Gem className="w-4 h-4 fill-current" />
            <span className="font-number">
              {data?.user?.profile?.diamonds || 0} Gems
            </span>
          </div>
        </div>
      </header>

      {/* 2. Dashboard Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Lesson Tree Map */}
        <div className="lg:col-span-2 space-y-12">
          {units.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/40 space-y-4">
              <ClipboardX className="w-12 h-12 text-zinc-400 mx-auto" />
              <h3 className="font-heading font-semibold text-xl">
                No course content seeded
              </h3>
              <p className="text-zinc-500 max-w-sm mx-auto">
                As an admin, you can populate the database with achievements and
                courses instantly.
              </p>
              <Link
                to="/admin"
                className="btn-premium px-6 py-2.5 inline-block"
              >
                Go to Admin Panel
              </Link>
            </div>
          ) : (
            units.map((unit) => (
              <section key={unit.id} className="space-y-6">
                {/* Unit Header Banner */}
                <div className="p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/60 shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest">
                      Unit {unit.number}
                    </span>
                    <h2 className="text-2xl font-heading font-bold text-zinc-800 dark:text-zinc-50">
                      {unit.title}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {unit.description}
                    </p>
                  </div>
                </div>

                {/* Unit Chapters & Lessons Map */}
                <div className="space-y-4 pl-4 border-l-2 border-zinc-200/50 dark:border-zinc-800/50">
                  {unit.chapters?.map((chapter) => (
                    <div key={chapter.id} className="space-y-3 pt-2">
                      <div className="pl-4 relative">
                        <div className="absolute left-[-21px] top-2.5 w-2 h-2 rounded-full bg-pink-500" />
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Chapter {chapter.number}: {chapter.title}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {chapter.description}
                        </p>
                      </div>

                      {/* Lesson Node Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
                        {chapter.lessons?.map((lesson) => {
                          const isCompleted = completedSet.has(lesson.id);
                          const isUnlocked =
                            isCompleted ||
                            !nextLesson ||
                            lesson.id === nextLesson.id ||
                            lesson.number === 1 ||
                            completedSet.has(lesson.id - 1);
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonClick(lesson)}
                              className={`p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all duration-300 relative group ${
                                isCompleted
                                  ? "border-pink-500/20 bg-pink-500/5 shadow-sm"
                                  : isUnlocked
                                    ? "border-zinc-200 dark:border-zinc-800 hover:border-pink-500/50 bg-white dark:bg-zinc-900 shadow-premium"
                                    : "border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20 opacity-55 cursor-not-allowed"
                              }`}
                            >
                              <div className="space-y-1">
                                <p
                                  className={`text-sm font-semibold ${isUnlocked ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-400"}`}
                                >
                                  Lesson {lesson.number}: {lesson.title}
                                </p>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-number">
                                  +{lesson.xpReward} XP
                                </span>
                              </div>

                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isCompleted
                                    ? "bg-pink-500 text-white"
                                    : isUnlocked
                                      ? "bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform"
                                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
                                }`}
                              >
                                {isCompleted ? (
                                  <Play className="w-4 h-4 fill-current" />
                                ) : isUnlocked ? (
                                  <Play className="w-4 h-4 fill-current" />
                                ) : (
                                  <Lock className="w-4 h-4" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Right Column: Dynamic Sidebars */}
        <div className="space-y-8">
          {/* Level Progression Card */}
          <div className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium space-y-4 group hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.12)] transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 shrink-0 group-hover:bg-pink-500/25 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
                <Crown className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Your Progress
                </h4>
                <h3 className="font-heading font-bold text-xl text-zinc-800 dark:text-zinc-100">
                  Level {userLevel}
                </h3>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-500 font-number">
                <span>
                  {remainingXp} / {nextLevelXp} XP
                </span>
                <span>{levelProgressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily XP Goal Card */}
          <div className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium flex flex-col items-center text-center space-y-4 group hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.12)] transition-all duration-300">
            <h3 className="font-heading font-semibold text-base group-hover:text-pink-500 transition-colors duration-300">
              Daily Goal Progress
            </h3>

            <div
              className="relative w-36 h-36 rounded-full flex items-center justify-center active-ring"
              style={{ "--progress": `${progressPercent}%` }}
            >
              <div className="w-28 h-28 rounded-full bg-white dark:bg-zinc-900 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-number tracking-tight">
                  {currentXp}
                </span>
                <span className="text-xs text-zinc-400 uppercase tracking-widest font-semibold font-number">
                  / {dailyGoalXp} XP
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {progressPercent >= 100
                ? "🎉 Daily goal completed! Great job!"
                : `Earn ${Math.max(0, dailyGoalXp - currentXp)} more XP to reach your daily goal.`}
            </p>
          </div>

          {/* Activity Heatmap Grid */}
          <div className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-4 group hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.12)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base group-hover:text-pink-500 transition-colors duration-300">
                Activity Heatmap
              </h3>
              <Calendar className="w-4 h-4 text-zinc-400 group-hover:text-pink-500 transition-colors duration-305" />
            </div>

            <div className="grid grid-cols-7 gap-1.5 w-full">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-md transition-all duration-300 ${
                    i === 27 || i === 25 || i === 24 || i === 20
                      ? "bg-pink-500 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-850"
                  }`}
                  title={`Day ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>Less active</span>
              <span>More active</span>
            </div>
          </div>

          {/* Unlocked Achievements list */}
          <div className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-4 group hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.12)] transition-all duration-300">
            <h3 className="font-heading font-semibold text-base group-hover:text-pink-500 transition-colors duration-300">
              Unlocked Achievements
            </h3>

            {achievements.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-zinc-150 dark:border-zinc-850 rounded-2xl">
                <Award className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">
                  No achievements unlocked yet. Keep learning!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {achievements.map((ua) => (
                  <div
                    key={ua.id}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-pink-500/20 bg-pink-500/5 text-pink-500 text-center relative cursor-pointer hover:bg-pink-500/10 transition-colors duration-300"
                    title={`${ua.achievement.title}: ${ua.achievement.description}`}
                  >
                    <Award className="w-6 h-6 mb-1" />
                    <span className="text-[9px] font-bold truncate max-w-full">
                      {ua.achievement.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Lesson Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Start Lesson Track"
      >
        <div className="space-y-4 text-center">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            You are about to begin{" "}
            <strong>
              Lesson {selectedLesson?.number}: {selectedLesson?.title}
            </strong>
            . Ready to test your language skills?
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={startLesson}
              className="btn-premium px-6 py-3 text-sm shadow-none"
            >
              Start (+{selectedLesson?.xpReward} XP)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
