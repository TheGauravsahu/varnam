import React from 'react';

export default function Logo({ className = "w-6 h-6" }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
      </defs>
      {/* Premium minimal geometric abstract folding sparkle/star emblem */}
      <path
        d="M16 2L20.5 11.5L30 16L20.5 20.5L16 30L11.5 20.5L2 16L11.5 11.5L16 2Z"
        fill="currentColor"
      />
      <path
        d="M16 8L18.25 13.75L24 16L18.25 18.25L16 24L13.75 18.25L8 16L13.75 13.75L16 8Z"
        fill="currentColor"
        className="text-white dark:text-zinc-900"
        opacity="0.9"
      />
    </svg>
  );
}
