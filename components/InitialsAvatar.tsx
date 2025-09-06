import React from 'react';

interface InitialsAvatarProps {
  name: string;
  size?: number;
  textSize?: string;
  className?: string;
}

// Simple hash function to get a color from a string
const nameToColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
  ];
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const getInitials = (name: string): string => {
  if (!name) return '';
  const words = name.trim().split(' ').filter(w => w.length > 0);
  if (words.length > 1) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
   if (words.length === 1 && words[0].length > 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  return '';
};

const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ name, size = 10, textSize = 'text-base', className = '' }) => {
  const initials = getInitials(name);
  const colorClass = nameToColor(name);

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 ${colorClass} w-${size} h-${size} ${className}`}
      aria-label={`Avatar for ${name}`}
    >
      <span className={textSize}>{initials}</span>
    </div>
  );
};

export default InitialsAvatar;
