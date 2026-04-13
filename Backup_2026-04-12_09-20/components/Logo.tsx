import React from 'react';

export const Logo = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="100" height="100" rx="20" fill="currentColor" fillOpacity="0.1" />
    <path d="M30 70V50" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 70V30" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M70 70V40" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 50L50 20L80 40" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
