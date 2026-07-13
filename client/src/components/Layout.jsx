import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trophy, 
  User, 
  Settings, 
  Info, 
  LogOut, 
  Sun, 
  Moon, 
  Crown, 
  Flame, 
  Compass,
  Menu,
  X,
  Award,
  SlidersHorizontal,
  Gamepad2,
  RefreshCw,
  Smile,
  BookOpen,
  CreditCard,
  Users2,
  Building2,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore.js';
import { useThemeStore } from '../stores/themeStore.js';
import sound from './SoundEngine.js';
import Logo from './Logo.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname;

  // Initialize gamification theme and background animations
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Theme state & toggler
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    sound.playClick();
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    sound.playClick();
    await logout();
    navigate('/');
  };

  // Nav items configuration
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Gamification', path: '/gamification', icon: Gamepad2 },
    { name: 'Spin Wheel', path: '/spin', icon: RefreshCw },
    { name: 'Avatar Builder', path: '/avatar', icon: Smile },
    { name: 'Vocabulary', path: '/vocabulary', icon: BookOpen },
    { name: 'Flashcards', path: '/flashcards', icon: CreditCard },
    { name: 'Clubs', path: '/clubs', icon: Building2 },
    { name: 'Friends', path: '/friends', icon: Users2 },
    { name: 'Profile Card', path: '/profile-card', icon: Sparkles },
    { name: 'Levels', path: '/levels', icon: Award },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About & FAQ', path: '/about', icon: Info },
  ];

  if (user && user.role === 'admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: SlidersHorizontal, isAdmin: true });
  }

  // If user is not logged in, render basic landing layout shell
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        <header className="sticky top-0 z-50 border-b border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-heading font-semibold text-pink-600 dark:text-pink-400">
              <Logo className="w-6 h-6 animate-pulse" />
              <span>Varnam</span>
            </Link>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggler */}
              <button 
                onClick={toggleTheme} 
                className="w-10 h-10 rounded-xl border border-zinc-200/50 dark:border-zinc-850 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-600 dark:text-zinc-300 flex items-center justify-center focus:outline-none"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <Link 
                to="/login" 
                className="hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all active:scale-95"
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' }}
              >
                Start Learning
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 1. Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900 shrink-0 p-6 space-y-8 h-screen sticky top-0 sidebar-scrollable">
        
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-heading font-semibold text-pink-600 dark:text-pink-400 px-2">
          <Logo className="w-6 h-6" />
          <span>Varnam</span>
        </Link>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.path || activePage.startsWith(item.path + '/');
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => sound.playClick()}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 ${
                  isActive
                    ? item.isAdmin 
                      ? 'bg-pink-500/10 text-pink-500 font-bold'
                      : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Details */}
        <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/40">
          
          {/* Quick User Stats */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center font-bold text-pink-500 uppercase">
              {user.username.substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <div className="flex items-center gap-1 text-xs text-orange-500">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{user.profile?.streakCount || 0} Day Streak</span>
              </div>
            </div>
          </div>

          {/* Theme & Logout Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={toggleTheme}
              className="flex-1 py-2 px-3 rounded-xl border border-zinc-200 dark:border-transparent text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 focus:outline-none"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
              <span>Mode</span>
            </button>
            <button 
              onClick={handleLogout}
              className="py-2 px-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-all flex items-center justify-center gap-1 focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Work Panel Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-6 h-16 border-b border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900 sticky top-0 z-40">
          <Link to="/dashboard" className="flex items-center gap-2 text-lg font-heading font-semibold text-pink-600 dark:text-pink-400">
            <Logo className="w-5 h-5" />
            <span>Varnam</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-transparent text-zinc-500 dark:text-zinc-400 flex items-center justify-center focus:outline-none"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center focus:outline-none"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Drawer Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-64 max-w-[80vw] h-full bg-white dark:bg-zinc-950 p-6 flex flex-col space-y-6 shadow-2xl sidebar-scrollable" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-xl font-heading font-semibold text-pink-600 dark:text-pink-400">
                  <Logo className="w-5 h-5" />
                  <span>Varnam</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.path || activePage.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => {
                        sound.playClick();
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                        isActive
                          ? 'bg-pink-500/10 text-pink-650 dark:text-pink-400 font-bold'
                          : 'text-zinc-650 dark:text-zinc-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center font-bold text-pink-500 uppercase">
                    {user.username.substring(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{user.username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit Account</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Dynamic Pages Area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* 3. Mobile Bottom Tabs Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-zinc-200/40 dark:border-zinc-800/40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md flex items-center justify-around px-4 z-40">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.path || activePage.startsWith(item.path + '/');
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => sound.playClick()}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
                  isActive ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
