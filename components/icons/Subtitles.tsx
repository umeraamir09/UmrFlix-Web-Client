import React from 'react';

const Subtitles: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <path d="m7 21 2-2-2-2"></path>
    <path d="m17 21-2-2 2-2"></path>
    <path d="M7 9h10"></path>
    <path d="M7 13h4"></path>
  </svg>
);

export default Subtitles;
