import React from 'react';

interface HighlightedNameProps {
  name: string;
  matchedSubstrings: string[];
  isPhallic: boolean;
  className?: string;
}

export const HighlightedName: React.FC<HighlightedNameProps> = ({
  name,
  matchedSubstrings,
  isPhallic,
  className = '',
}) => {
  if (!isPhallic || matchedSubstrings.length === 0) {
    return <span className={className}>{name}</span>;
  }

  // Sort substrings longest first to avoid partial overlap issues
  const sortedSubs = [...matchedSubstrings]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (sortedSubs.length === 0) {
    return <span className={className}>{name}</span>;
  }

  const escaped = sortedSubs.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = name.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = sortedSubs.some((s) => s.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={i}
              className="bg-orange-500/25 text-orange-300 font-extrabold px-1 rounded border border-orange-500/40 underline decoration-orange-400/80 decoration-2 underline-offset-2"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};
