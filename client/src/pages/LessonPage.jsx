import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Award, 
  Coins, 
  Gem, 
  Zap, 
  Flame, 
  Crown 
} from 'lucide-react';
import gsap from 'gsap';
import axiosClient from '../api/axiosClient.js';
import sound from '../components/SoundEngine.js';
import { useConfirmStore } from '../stores/confirmStore.js';
import { useAuthStore } from '../stores/authStore.js';
import Loader from '../components/Loader.jsx';

const HINDI_TRANSLATIONS = {
  // Instructions
  'Translate this greeting': 'इस अभिवादन का अनुवाद करें',
  'True or False': 'सही या गलत',
  'Fill in the blank to say "See you later"': '"See you later" (फिर मिलते हैं) कहने के लिए खाली स्थान भरें',
  'Match the greetings': 'अभिवादनों का मिलान करें',
  'Select the best response for: "How are you?"': '"How are you?" (आप कैसे हैं?) के लिए सबसे अच्छा उत्तर चुनें',
  'Complete the statement: "I am fine"': 'कथन पूरा करें: "I am fine" (मैं ठीक हूँ)',
  'Is this response polite?': 'क्या यह उत्तर विनम्र है?',
  'Translate this order': 'इस ऑर्डर का अनुवाद करें',
  'Complete the request': 'अनुरोध पूरा करें',
  'Complete the self-introduction: "My name is..."': 'आत्म-परिचय पूरा करें: "My name is..." (मेरा नाम है...)',
  'Match the pairs correctly': 'जोड़ों का सही मिलान करें',
  'Select the correct translation': 'सही अनुवाद चुनें',
  'Translate: "Nice to meet you"': 'अनुवाद करें: "Nice to meet you" (आपसे मिलकर अच्छा लगा)',
  'Is this statement correct?': 'क्या यह कथन सही है?',
  
  // Questions / Prompts
  'Hello': 'नमस्ते (Hello)',
  'Goodbye': 'अलविदा (Goodbye)',
  'Thanks': 'धन्यवाद (Thanks)',
  'Please': 'कृपया (Please)',
  'How are you?': 'आप कैसे हैं? (How are you?)',
  'Nice to meet you': 'आपसे मिलकर खुशी हुई (Nice to meet you)',
  'I would like a coffee, please.': 'मुझे एक कॉफ़ी चाहिए, कृपया। (I would like a coffee, please.)',
  'Could I have a glass of water?': 'क्या मुझे एक गिलास पानी मिल सकता है? (Could I have a glass of water?)',
  'Answering "I am fine, and you?" is standard conversational etiquette.': '"I am fine, and you?" (मैं ठीक हूँ, और आप?) उत्तर देना बातचीत का मानक शिष्टाचार है।',
  '"Goodbye" is a formal way to say goodbye.': '"Goodbye" अलविदा कहने का एक औपचारिक तरीका है।',
  'Match words': 'शब्दों का मिलान करें',
  'Match gratitude pairs': 'आभार के जोड़ों का मिलान करें',
  'Match greetings': 'अभिवादनों का मिलान करें',
  'See you ______': 'फिर ______ (See you ______)',
  'I ______ fine, thanks.': 'मैं ठीक ______, धन्यवाद। (I ______ fine, thanks.)',
  'Me ______ Carlos': 'मेरा नाम ______ कार्लोस है। (Me ______ Carlos)',

  // Match options / Choices
  'Hola': 'नमस्ते (Hola)',
  'Adiós': 'अलविदा (Adiós)',
  'Gracias': 'धन्यवाद (Gracias)',
  'Buenos días': 'शुभ प्रभात (Buenos días)',
  'De nada': 'कोई बात नहीं (De nada)',
  'Mucho gusto': 'आपसे मिलकर अच्छा लगा (Mucho gusto)',
  'Me llamo Juan': 'मेरा नाम जुआन है (Me llamo Juan)',
  'Buenas noches': 'शुभरात्रि (Buenas noches)',
  'How are you?': 'आप कैसे हैं? (How are you?)',
  'I am doing well, thank you!': 'मैं ठीक हूँ, धन्यवाद! (I am doing well, thank you!)',
  'I live in London.': 'मैं लंदन में रहता हूँ। (I live in London.)',
  'My name is Bob.': 'मेरा नाम बॉब है। (My name is Bob.)',
  'Goodbye.': 'अलविदा। (Goodbye.)',
  'A coffee, please.': 'एक कॉफ़ी, कृपया। (A coffee, please.)',
  'A tea, please.': 'एक चाय, कृपया। (A tea, please.)',
  'No coffee.': 'कॉफ़ी नहीं। (No coffee.)',
  'Where is coffee?': 'कॉफ़ी कहाँ है? (Where is coffee?)',
};

const translateExercise = (ex, user) => {
  if (user?.profile?.nativeLanguage !== 'Hindi') return ex;

  const translateStr = (str) => HINDI_TRANSLATIONS[str] || str;

  // Deep copy exercise to avoid caching bugs
  const newEx = JSON.parse(JSON.stringify(ex));
  
  newEx.instruction = translateStr(newEx.instruction);
  newEx.questionText = translateStr(newEx.questionText);

  if (newEx.type === 'matching') {
    const parts = newEx.correctAnswer.split('|').map(pair => {
      const [left, right] = pair.split(':');
      return `${translateStr(left)}:${right}`;
    });
    newEx.correctAnswer = parts.join('|');

    if (Array.isArray(newEx.choices)) {
      newEx.choices = newEx.choices.map(choice => ({
        left: translateStr(choice.left),
        right: choice.right
      }));
    }
  } else if (Array.isArray(newEx.choices)) {
    newEx.choices = newEx.choices.map(c => translateStr(c));
  }
  
  if (newEx.type !== 'matching') {
    newEx.correctAnswer = translateStr(newEx.correctAnswer);
  }

  return newEx;
};

export default function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirmStore(state => state.confirm);
  const { user } = useAuthStore();

  // Exercise Engine States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);

  // Gamification combo & mistakes states
  const [mistakes, setMistakes] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [comboActive, setComboActive] = useState(false);

  // Matching game states
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState(new Set()); // e.g., "Hola:Hello"
  const [matchingAttempts, setMatchingAttempts] = useState(0);

  // Completion Overlay states
  const [isFinished, setIsFinished] = useState(false);
  const [finishData, setFinishData] = useState(null);

  // GSAP animation refs
  const exerciseContainerRef = useRef(null);
  const completionContainerRef = useRef(null);

  // Fetch lesson contents
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lesson', id],
    queryFn: async () => {
      const res = await axiosClient.get(`/lessons/${id}`);
      return res.data;
    }
  });

  // Submit lesson progress mutation
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosClient.post(`/lessons/${id}/submit`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      sound.playLevelUp(); // play triumphant level up arpeggio
      setFinishData(data);
      setIsFinished(true);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });

  const lesson = data?.lesson;
  const exercises = data?.exercises || [];
  
  const rawExercise = exercises[currentIndex];
  const currentExercise = React.useMemo(() => {
    if (!rawExercise) return null;
    return translateExercise(rawExercise, user);
  }, [rawExercise, user]);

  // Intercept refresh or page navigation to prevent accidental quits
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Quit Lesson? Your progress on this lesson will be lost.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleQuit = async () => {
    sound.playClick();
    const ok = await confirm({
      title: 'Quit Lesson?',
      message: 'Are you sure you want to quit? Your progress on this lesson will be lost.',
      confirmText: 'Yes, Quit',
      cancelText: 'Cancel'
    });
    if (ok) {
      navigate('/dashboard');
    }
  };

  // Evaluate normal questions (multiple choice, true/false, fill blank)
  const handleCheck = () => {
    if (!selectedChoice) return;

    const answer = selectedChoice.trim().toLowerCase();
    const correct = currentExercise.correctAnswer.trim().toLowerCase();
    const correctMatch = answer === correct;

    setIsCorrect(correctMatch);
    setAnswered(true);

    if (correctMatch) {
      sound.playCorrect();
      setCorrectCount(prev => prev + 1);
      setComboCount(prev => {
        const next = prev + 1;
        if (next >= 5) setComboActive(true);
        return next;
      });
      // Play mini pop animation on success panel
      gsap.fromTo('.success-panel', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' });
    } else {
      sound.playIncorrect();
      setMistakes(prev => prev + 1);
      setComboCount(0);
      setComboActive(false);
      // Shake the container using GSAP to signal errors
      gsap.fromTo(exerciseContainerRef.current, 
        { x: -10 }, 
        { x: 0, duration: 0.5, ease: 'rough({template: none.out, strength: 8, points: 20, taper: none, randomize: true, clamp:  true})' }
      );
      gsap.fromTo('.error-panel', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' });
    }
  };

  // Evaluate matching game selections
  const handleLeftMatchClick = (item) => {
    sound.playClick();
    if (selectedLeft === item) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(item);
      if (selectedRight) {
        checkMatchingPair(item, selectedRight);
      }
    }
  };

  const handleRightMatchClick = (item) => {
    sound.playClick();
    if (selectedRight === item) {
      setSelectedRight(null);
    } else {
      setSelectedRight(item);
      if (selectedLeft) {
        checkMatchingPair(selectedLeft, item);
      }
    }
  };

  const checkMatchingPair = (left, right) => {
    const pairString = `${left}:${right}`;
    const reversePairString = `${right}:${left}`;
    
    // The correct answers for matching are stringified as "left:right|left2:right2"
    const correctMatches = currentExercise.correctAnswer.split('|');
    const isPairCorrect = correctMatches.includes(pairString) || correctMatches.includes(reversePairString);

    if (isPairCorrect) {
      sound.playTone(600, 0.1, this?.ctx?.currentTime || 0); // pleasant mini beep
      const newMatched = new Set(matchedPairs);
      newMatched.add(left);
      newMatched.add(right);
      setMatchedPairs(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      // Check if all pairs are matched
      const totalPairsCount = correctMatches.length;
      if (newMatched.size >= totalPairsCount * 2) {
        // Entire matching exercise completed correctly!
        setCorrectCount(prev => prev + 1);
        setIsCorrect(true);
        setAnswered(true);
        sound.playCorrect();
        setComboCount(prev => {
          const next = prev + 1;
          if (next >= 5) setComboActive(true);
          return next;
        });
      }
    } else {
      sound.playTone(200, 0.15, this?.ctx?.currentTime || 0); // flat buzz tone
      setMistakes(prev => prev + 1);
      setComboCount(0);
      setComboActive(false);
      // Shake choices
      gsap.fromTo('.matching-grid', 
        { x: -5 }, 
        { x: 0, duration: 0.4, ease: 'bounce.out' }
      );
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const handleContinue = () => {
    sound.playClick();
    setAnswered(false);
    setIsCorrect(null);
    setSelectedChoice('');
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedPairs(new Set());

    // Exit to next question or submit completion
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete lesson! Send score + gamification payload
      submitMutation.mutate({
        score: correctCount,
        total: exercises.length,
        perfectLesson: mistakes === 0,
        comboActive: comboActive
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader message="Loading exercise content..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 border border-red-500/20 bg-red-500/10 rounded-2xl text-center space-y-4">
        <p className="text-red-500 font-semibold">Error loading lesson data.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-premium px-6 py-2">Return Dashboard</button>
      </div>
    );
  }

  // Calculate layout progress percentage
  const progressPercent = Math.round((currentIndex / exercises.length) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 1. Lesson Header */}
      {!isFinished && (
        <header className="sticky top-0 z-40 border-b border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-950 px-6 h-16 flex items-center justify-between gap-6 max-w-4xl mx-auto w-full">
          <button 
            onClick={handleQuit}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-500 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Core progress tracker */}
          <div className="flex-grow max-w-md h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Combo indicator badge */}
          {comboCount >= 5 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold text-xs combo-indicator shrink-0">
              <span>🔥 {comboCount} Combo</span>
              <span className="xp-multiplier">1.5x</span>
            </div>
          )}

          <span className="text-xs font-bold font-number text-zinc-400 shrink-0">
            {currentIndex + 1} / {exercises.length}
          </span>
        </header>
      )}

      {/* 2. Interactive Exercise Body Panel */}
      {!isFinished && currentExercise && (
        <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-6 py-8">
          <div ref={exerciseContainerRef} className="space-y-8">
            
            {/* Instruction Banner */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400">
                {currentExercise.type.replace('_', ' ')}
              </span>
              <h2 className="text-3xl font-heading font-bold text-zinc-800 dark:text-zinc-50">
                {currentExercise.instruction}
              </h2>
            </div>

            {/* Target Question Text */}
            {currentExercise.type !== 'matching' && (
              <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-premium flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-zinc-800 dark:text-zinc-100">
                  {currentExercise.questionText}
                </h3>
              </div>
            )}

            {/* ----------------------------- */}
            {/* EXERCISE OPTIONS RENDERING */}
            {/* ----------------------------- */}

            {/* Options block for Multiple Choice / True/False / Fill Blanks */}
            {currentExercise.type !== 'matching' && (
              <div className="grid grid-cols-1 gap-3">
                {currentExercise.choices?.map((choice) => {
                  const isSelected = selectedChoice === choice;
                  return (
                    <button
                      key={choice}
                      disabled={answered}
                      onClick={() => { sound.playClick(); setSelectedChoice(choice); }}
                      className={`w-full text-left px-5 py-4 rounded-2xl border text-base font-semibold transition-all flex items-center justify-between ${
                        answered
                          ? choice.toLowerCase() === currentExercise.correctAnswer.toLowerCase()
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isSelected
                              ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'border-zinc-200 dark:border-zinc-800 opacity-50'
                          : isSelected
                            ? 'border-pink-500 bg-pink-500/5 text-pink-600 dark:text-pink-400 ring-2 ring-pink-500/20'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-500 dark:hover:border-pink-500 hover:bg-pink-500/5 bg-white dark:bg-zinc-900 shadow-premium'
                      }`}
                    >
                      <span>{choice}</span>
                      {answered && choice.toLowerCase() === currentExercise.correctAnswer.toLowerCase() && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                      {answered && isSelected && choice.toLowerCase() !== currentExercise.correctAnswer.toLowerCase() && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Options block for Matching Card Game */}
            {currentExercise.type === 'matching' && (
              <div className="grid grid-cols-2 gap-6 matching-grid">
                
                {/* Left Cards Column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-center">Spanish</h4>
                  {currentExercise.choices?.map((pair) => {
                    const isSelected = selectedLeft === pair.left;
                    const isMatched = matchedPairs.has(pair.left);
                    return (
                      <button
                        key={pair.left}
                        disabled={isMatched || answered}
                        onClick={() => handleLeftMatchClick(pair.left)}
                        className={`w-full text-center px-4 py-4 rounded-2xl border text-sm font-semibold transition-all ${
                          isMatched 
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600/55 dark:text-emerald-400/55 cursor-not-allowed opacity-50'
                            : isSelected
                              ? 'border-pink-500 bg-pink-500/5 text-pink-600 dark:text-pink-400 ring-2 ring-pink-500/20'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-500 bg-white dark:bg-zinc-900 shadow-premium'
                        }`}
                      >
                        {pair.left}
                      </button>
                    );
                  })}
                </div>

                {/* Right Cards Column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-center">English</h4>
                  {currentExercise.choices?.map((pair) => {
                    const isSelected = selectedRight === pair.right;
                    const isMatched = matchedPairs.has(pair.right);
                    return (
                      <button
                        key={pair.right}
                        disabled={isMatched || answered}
                        onClick={() => handleRightMatchClick(pair.right)}
                        className={`w-full text-center px-4 py-4 rounded-2xl border text-sm font-semibold transition-all ${
                          isMatched 
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600/55 dark:text-emerald-400/55 cursor-not-allowed opacity-50'
                            : isSelected
                              ? 'border-pink-500 bg-pink-500/5 text-pink-600 dark:text-pink-400 ring-2 ring-pink-500/20'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-500 bg-white dark:bg-zinc-900 shadow-premium'
                        }`}
                      >
                        {pair.right}
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </main>
      )}

      {/* 3. Action Evaluation Footer Panel */}
      {!isFinished && (
        <footer className="border-t border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/60 py-6 px-6 sticky bottom-0 z-40">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            
            {/* Answer Correct Summary banner */}
            {answered && isCorrect && (
              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-start gap-3 success-panel">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">Correct!</p>
                  <p className="text-xs text-emerald-500/90 mt-0.5">You've mastered this structure. Keep it up!</p>
                </div>
              </div>
            )}

            {/* Answer Incorrect Summary banner */}
            {answered && !isCorrect && (
              <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 flex items-start gap-3 error-panel">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">Oops! That wasn't correct.</p>
                  <p className="text-xs text-red-500/90 mt-0.5">Correct Answer: {currentExercise.correctAnswer}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              {answered ? (
                <button
                  onClick={handleContinue}
                  className="btn-premium px-8 py-3.5 text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled={!selectedChoice && currentExercise?.type !== 'matching'}
                  onClick={handleCheck}
                  className="btn-premium px-8 py-3.5 text-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Check Answer</span>
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* 4. Lesson Completion Overlay (Triumphant stats display) */}
      {isFinished && finishData && (
        <div 
          ref={completionContainerRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 overflow-y-auto"
        >
          {/* Confetti decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/10 via-rose-500/5 to-transparent pointer-events-none -z-10" />

          <div className="w-full max-w-lg p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium text-center space-y-8">
            
            {/* Header Triumph */}
            <div className="space-y-3">
              {finishData.perfectLesson ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="text-6xl crown-animate">👑</div>
                  <h3 className="text-2xl font-heading font-black text-yellow-500 uppercase tracking-wider animate-bounce">
                    Perfect Lesson!
                  </h3>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center mx-auto shadow-sm">
                  <Crown className="w-8 h-8 fill-current animate-pulse" />
                </div>
              )}
              <h2 className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50">
                {finishData.perfectLesson ? 'Flawless Victory!' : 'Lesson Complete!'}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                {finishData.perfectLesson 
                  ? "Awesome! You didn't make a single mistake." 
                  : `Amazing work! You've successfully finished ${lesson?.title || 'this lesson'}.`}
              </p>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/30 bg-zinc-50/50 dark:bg-zinc-950/20">
                <Zap className="w-5 h-5 text-pink-600 dark:text-pink-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">XP Gained</span>
                <span className="text-base font-bold font-number text-pink-600 dark:text-pink-400">+{finishData.xpEarned} XP</span>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/30 bg-zinc-50/50 dark:bg-zinc-950/20">
                <Coins className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Coins</span>
                <span className="text-base font-bold font-number text-yellow-500">+{finishData.coinsEarned}</span>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/30 bg-zinc-50/50 dark:bg-zinc-950/20">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1 fill-current" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Streak</span>
                <span className="text-base font-bold font-number text-orange-500">{finishData.profile?.streakCount} days</span>
              </div>
            </div>

            {/* Level Progression Indicator */}
            {finishData.levelStats && (
              <div className="p-5 rounded-2xl border border-pink-500/20 bg-pink-500/5 text-left space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-pink-600 dark:text-pink-400">
                  <span className="flex items-center gap-1">
                    <Crown className="w-4 h-4 fill-current" />
                    <strong>Level {finishData.levelStats.level}</strong>
                  </span>
                  <span className="font-number">{finishData.levelStats.xpInLevel} / {finishData.levelStats.xpNeededForNext} XP</span>
                </div>
                <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${finishData.levelStats.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Exit Action button */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-premium w-full py-4 text-base flex items-center justify-center gap-2 shadow-none"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
