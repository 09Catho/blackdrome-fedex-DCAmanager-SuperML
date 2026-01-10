'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLATimerProps {
  slaDueAt: string | null;
  slaBreached?: boolean;
  compact?: boolean;
}

export function SLATimer({ slaDueAt, slaBreached = false, compact = false }: SLATimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [status, setStatus] = useState<'normal' | 'warning' | 'critical' | 'breached'>('normal');

  useEffect(() => {
    if (!slaDueAt) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const due = new Date(slaDueAt).getTime();
      const diff = due - now;

      if (diff < 0 || slaBreached) {
        const hoursOver = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
        const minutesOver = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`Breached ${hoursOver}h ${minutesOver}m ago`);
        setStatus('breached');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Determine status based on time remaining
      if (hours < 4) {
        setStatus('critical');
      } else if (hours < 24) {
        setStatus('warning');
      } else {
        setStatus('normal');
      }

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        setTimeRemaining(`${days}d ${remainingHours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [slaDueAt, slaBreached]);

  if (!slaDueAt) {
    return null;
  }

  const statusColors = {
    normal: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    critical: 'bg-orange-100 text-orange-800 border-orange-300',
    breached: 'bg-red-100 text-red-800 border-red-300'
  };

  const statusIcons = {
    normal: <Clock className="w-4 h-4" />,
    warning: <Clock className="w-4 h-4" />,
    critical: <AlertTriangle className="w-4 h-4" />,
    breached: <AlertTriangle className="w-4 h-4" />
  };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${statusColors[status]}`}>
        {statusIcons[status]}
        <span>{timeRemaining}</span>
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusColors[status]}`}>
      {statusIcons[status]}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide">
          {status === 'breached' ? 'SLA Breached' : 'SLA Time Remaining'}
        </div>
        <div className="text-sm font-bold">{timeRemaining}</div>
      </div>
    </div>
  );
}
