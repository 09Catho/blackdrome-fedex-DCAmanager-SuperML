'use client';

import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SLABadgeProps {
  slaBreached: boolean;
  slaDueAt: string | null;
}

export function SLABadge({ slaBreached, slaDueAt }: SLABadgeProps) {
  if (!slaDueAt) {
    return null;
  }

  if (slaBreached) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
        <AlertTriangle className="w-3 h-3" />
        SLA Breach
      </span>
    );
  }

  // Check if SLA is approaching
  const now = new Date().getTime();
  const due = new Date(slaDueAt).getTime();
  const hoursRemaining = (due - now) / (1000 * 60 * 60);

  if (hoursRemaining < 4) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300 animate-pulse">
        <Clock className="w-3 h-3" />
        Critical
      </span>
    );
  }

  if (hoursRemaining < 24) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
        <Clock className="w-3 h-3" />
        Due Soon
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" />
      On Track
    </span>
  );
}
