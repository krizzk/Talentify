'use client';

import { Badge } from '@/components/ui/Badge';

interface KeywordBadgeProps {
  keyword: string;
  variant: 'matched' | 'missing';
}

export function KeywordBadge({ keyword, variant }: KeywordBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold backdrop-blur ${
        variant === 'matched'
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
          : 'border-rose-500/20 bg-rose-500/10 text-rose-200'
      }`}
    >
      {variant === 'missing' && <span className="text-lg">+</span>}
      {keyword}
    </span>
  );
}

interface KeywordListProps {
  matchedKeywords: string[];
  missingKeywords: string[];
}

export function KeywordList({ matchedKeywords, missingKeywords }: KeywordListProps) {
  return (
    <div className="space-y-6">
      {/* Matched Keywords */}
      {matchedKeywords.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Keyword Cocok ✓</h3>
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.map((keyword) => (
              <KeywordBadge key={keyword} keyword={keyword} variant="matched" />
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {missingKeywords.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Keyword Kurang</h3>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((keyword) => (
              <KeywordBadge key={keyword} keyword={keyword} variant="missing" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
