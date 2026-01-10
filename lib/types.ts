// Shared TypeScript types

import { CaseStatus, ActivityType, ClosureReason } from './sop';
import { UserRole } from './authGuards';

export interface DCA {
  id: string;
  name: string;
  region: string | null;
  created_at: string;
}

export interface Case {
  id: string;
  external_ref: string | null;
  customer_name: string | null;
  amount: number;
  currency: string;
  ageing_days: number;
  status: CaseStatus;
  assigned_dca_id: string | null;
  priority_score: number | null;
  recovery_prob_30d: number | null;
  reason_codes: string[] | null;
  next_action_due_at: string | null;
  sla_due_at: string | null;
  closure_reason: ClosureReason | null;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseSummary extends Case {
  assigned_dca_name: string | null;
  sla_breached: boolean | null;
  sla_escalated: boolean | null;
  activity_count: number;
  evidence_count: number;
}

export interface CaseActivity {
  id: string;
  case_id: string;
  actor_user_id: string;
  actor_role: UserRole;
  activity_type: ActivityType;
  payload: Record<string, any>;
  created_at: string;
}

export interface CaseAudit {
  id: string;
  case_id: string;
  actor_user_id: string | null;
  action: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  created_at: string;
}

export interface EvidenceFile {
  id: string;
  case_id: string;
  uploader_user_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface KPIOverview {
  total_open_cases: number;
  total_amount_open: number;
  total_amount_recovered: number;
  cases_by_status: Record<CaseStatus, number>;
  breaches_count: number;
  escalated_count: number;
  avg_ageing_days: number;
}

export interface AgeingBucket {
  bucket: string;
  case_count: number;
  total_amount: number;
  avg_priority_score: number;
}

export interface DCAScorecard {
  dca_id: string;
  dca_name: string;
  dca_region: string | null;
  open_cases: number;
  open_amount: number;
  avg_ageing: number;
  recovered_count: number;
  recovered_amount: number;
  breach_count: number;
  breach_rate_pct: number;
  avg_days_since_last_activity: number;
}
