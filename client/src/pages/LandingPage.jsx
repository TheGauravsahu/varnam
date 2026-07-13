import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  Flame, 
  Trophy, 
  Award, 
  Zap, 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import gsap from 'gsap';
import sound from '../components/SoundEngine.js';
import Footer from '../components/Footer.jsx';

export default function LandingPage() {
  const [demoAnswered, setDemoAnswered] = useState(false);
  const [demoCorrect, setDemoCorrect] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  // GSAP animation references
  const headerRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!headerRef.current || !cardsRef.current) return;
    
    // GSAP entrance staggers
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current.children, 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );

      gsap.fromTo(cardsRef.current.children, 
        { y: 45, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
      );
    });
    return () => ctx.revert();
  }, []);

  const handleDemoAnswer = (choice) => {
    if (demoAnswered) return;
    setSelectedChoice(choice);
    setDemoAnswered(true);
    if (choice === 'Hola') {
      setDemoCorrect(true);
      sound.playCorrect();
    } else {
      setDemoCorrect(false);
      sound.playIncorrect();
    }
  };

  const resetDemo = () => {
    sound.playClick();
    setDemoAnswered(false);
    setDemoCorrect(null);
    setSelectedChoice('');
  };

  const toggleFaq = (index) => {
    sound.playClick();
    setActiveFaq(prev => prev === index ? null : index);
  };

  const faqs = [
    { q: 'How does Varnam compare to Duolingo?', a: 'Varnam offers a sleek, high-information density layout inspired by Apple and Linear. Rather than childish characters, it focuses on minimal, lightning-fast quiz mechanics and spaced-repetition logs.' },
    { q: 'Is it completely free?', a: 'Yes! Varnam is open source and free. You can learn Spanish, English, Sanskrit, Hindi, French, and German using our initial curriculum track.' },
    { q: 'Does it support offline learning?', a: 'Varnam is a Progressive Web App (PWA). Once loaded, the assets are cached, allowing you to access the dashboard and review basics offline.' }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 w-full">
      
      {/* 1. Hero Content */}
      <section className="relative overflow-hidden min-h-[85vh] flex flex-col items-center justify-center px-6 pt-16 pb-20 max-w-7xl mx-auto w-full text-center">
        
        {/* Layered Premium SaaS Glow Blobs */}
        <div className="absolute top-1/4 left-1/2 w-[600px] h-[600px] bg-pink-500/20 dark:bg-pink-500/10 rounded-full pointer-events-none -z-10 pulsing-glow" />
        <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-rose-500/15 dark:bg-rose-500/8 rounded-full pointer-events-none -z-10 pulsing-glow" style={{ animationDelay: '-3s' }} />

        <div ref={headerRef} className="space-y-6 max-w-4xl z-10 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/25">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>NEXT GENERATION LANGUAGE LEARNING</span>
          </span>
          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
            Master Languages,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-pink-600">
              Beautifully & Fast.
            </span>
          </h1>
          <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Varnam combines premium Apple-inspired design, addictive gamification, and spaced repetition to make language fluency effortless. No clutter. Pure progress.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-2">
            <Link 
              to="/signup" 
              onClick={() => sound.playClick()}
              className="btn-premium w-full sm:w-auto text-center px-8 py-4 text-base flex items-center justify-center gap-2"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#demo" 
              onClick={() => sound.playClick()}
              className="btn-premium-secondary w-full sm:w-auto text-center px-8 py-4 text-base flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current text-pink-500" />
              <span>Try Live Demo</span>
            </a>
          </div>
        </div>

        {/* 2. Interactive Feature Grid */}
        <div 
          ref={cardsRef} 
          className="w-full mt-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl text-left"
        >
          <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur shadow-premium hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-pink-500/30 transition-all duration-300 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Addictive Streaks</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Lock in your streak. Turn learning into a daily ritual you won't break.</p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur shadow-premium hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-pink-500/30 transition-all duration-300 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
              <Trophy className="w-5 h-5 fill-current" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Weekly Leagues</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Promote to Diamond League. Compete with learners globally in real time.</p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur shadow-premium hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-pink-500/30 transition-all duration-300 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Achievements</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Earn medals, freeze streaks, and buy upgrades in our custom shop.</p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur shadow-premium hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-pink-500/30 transition-all duration-300 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Level Badges</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Level up your profile as you gain XP. Watch your rank grow dynamically.</p>
          </div>
        </div>
      </section>

      {/* 3. Live Interactive Demo Section */}
      <section id="demo" className="w-full py-20 border-t border-zinc-200/40 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-900/20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-pink-500/15 dark:bg-pink-500/8 rounded-full pointer-events-none -z-10 pulsing-glow" style={{ animationDelay: '-1.5s' }} />
        <div className="max-w-xl mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-heading font-bold">Try a Live Exercise</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Select the correct Spanish translation for "Hello"</p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">Question 1 of 1</span>
              <h3 className="text-2xl font-heading font-bold text-zinc-800 dark:text-zinc-100">Hello</h3>
            </div>

            {/* Answer Choices */}
            <div className="grid grid-cols-1 gap-3">
              {['Adiós', 'Hola', 'Gracias', 'Por favor'].map((choice) => {
                const isSelected = selectedChoice === choice;
                return (
                  <button
                    key={choice}
                    disabled={demoAnswered}
                    onClick={() => handleDemoAnswer(choice)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border text-base font-semibold transition-all flex items-center justify-between ${
                      demoAnswered
                        ? choice === 'Hola'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isSelected
                            ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'border-zinc-200 dark:border-zinc-800 opacity-50'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-500 dark:hover:border-pink-500 hover:bg-pink-500/5 bg-zinc-50/50 dark:bg-zinc-950/20'
                    }`}
                  >
                    <span>{choice}</span>
                    {demoAnswered && choice === 'Hola' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {demoAnswered && isSelected && choice !== 'Hola' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {/* Evaluation Toast */}
            {demoAnswered && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className={`text-sm font-semibold flex items-center gap-1.5 ${
                  demoCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {demoCorrect ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span>{demoCorrect ? 'Excellent! +10 XP earned.' : 'Oops! Correct answer is Hola.'}</span>
                </p>
                <button 
                  onClick={resetDemo}
                  className="btn-premium px-6 py-2.5 text-xs shadow-none w-full sm:w-auto"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Collapsible FAQs Section */}
      <section className="w-full py-20 px-6 max-w-4xl mx-auto relative overflow-hidden">
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/20 dark:bg-pink-500/10 rounded-full pointer-events-none -z-10 pulsing-glow" style={{ animationDelay: '-4.5s' }} />
        <div className="text-center space-y-4 mb-16 relative z-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">Frequently Asked Questions</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Everything you need to know about the platform.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl bg-white dark:bg-zinc-900 shadow-premium overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-semibold text-base focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <HelpCircle className={`w-5 h-5 text-pink-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/40 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
