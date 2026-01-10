// Shared scoring logic helpers (for display/explanation purposes)

export interface ScoringFeatures {
  ageing: number;
  log_amount: number;
  attempts: number;
  staleness: number;
  dispute: number;
  ptp_active: number;
}

export function formatProbability(prob: number | null): string {
  if (prob === null || prob === undefined) return 'N/A';
  return `${(prob * 100).toFixed(1)}%`;
}

export function formatPriorityScore(score: number | null): string {
  if (score === null || score === undefined) return 'N/A';
  return score.toFixed(0);
}

export function getPriorityLabel(score: number | null): { 
  label: string; 
  color: string;
  textColor: string;
  bgColor: string;
} {
  if (score === null || score === undefined) {
    return { 
      label: 'Not Scored', 
      color: 'text-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-100'
    };
  }

  if (score >= 7000) {
    return { 
      label: 'Critical', 
      color: 'text-red-600 font-bold',
      textColor: 'text-red-600',
      bgColor: 'bg-red-100'
    };
  } else if (score >= 5000) {
    return { 
      label: 'High', 
      color: 'text-orange-600 font-semibold',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-100'
    };
  } else if (score >= 3000) {
    return { 
      label: 'Medium', 
      color: 'text-yellow-600',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    };
  } else {
    return { 
      label: 'Low', 
      color: 'text-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-100'
    };
  }
}

export function getRecoveryProbabilityColor(prob: number | null): string {
  if (prob === null || prob === undefined) return 'text-gray-500';
  
  if (prob >= 0.7) return 'text-green-600';
  if (prob >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}
