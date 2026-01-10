-- Dashboard Views and Analytics
-- ====================================================
-- Materialized or regular views for dashboard KPIs
-- ====================================================

-- ====================================================
-- VIEW: v_kpi_overview (Overall platform KPIs)
-- ====================================================

CREATE OR REPLACE VIEW v_kpi_overview AS
SELECT
    COUNT(*) FILTER (WHERE status NOT IN ('CLOSED')) AS total_open_cases,
    COALESCE(SUM(amount) FILTER (WHERE status NOT IN ('CLOSED')), 0) AS total_amount_open,
    COALESCE(SUM(amount) FILTER (WHERE status = 'RECOVERED' OR closure_reason = 'RECOVERED'), 0) AS total_amount_recovered,
    jsonb_object_agg(status, case_count) AS cases_by_status,
    COUNT(*) FILTER (WHERE sla_breached = TRUE) AS breaches_count,
    COUNT(*) FILTER (WHERE status = 'ESCALATED') AS escalated_count,
    ROUND(AVG(ageing_days) FILTER (WHERE status NOT IN ('CLOSED')), 1) AS avg_ageing_days
FROM (
    SELECT
        c.status,
        c.amount,
        c.closure_reason,
        c.ageing_days,
        s.breached AS sla_breached,
        COUNT(*) AS case_count
    FROM cases c
    LEFT JOIN case_sla s ON c.id = s.case_id
    GROUP BY c.status, c.amount, c.closure_reason, c.ageing_days, s.breached
) subq;

-- ====================================================
-- VIEW: v_ageing_buckets (Cases grouped by ageing)
-- ====================================================

CREATE OR REPLACE VIEW v_ageing_buckets AS
SELECT
    bucket,
    COUNT(*) AS case_count,
    COALESCE(SUM(amount), 0) AS total_amount,
    ROUND(AVG(priority_score), 2) AS avg_priority_score
FROM (
    SELECT
        CASE
            WHEN ageing_days <= 30 THEN '0-30 days'
            WHEN ageing_days <= 60 THEN '31-60 days'
            WHEN ageing_days <= 90 THEN '61-90 days'
            ELSE '90+ days'
        END AS bucket,
        amount,
        priority_score
    FROM cases
    WHERE status NOT IN ('CLOSED')
) subq
GROUP BY bucket
ORDER BY
    CASE bucket
        WHEN '0-30 days' THEN 1
        WHEN '31-60 days' THEN 2
        WHEN '61-90 days' THEN 3
        ELSE 4
    END;

-- ====================================================
-- VIEW: v_dca_scorecard (DCA performance metrics)
-- ====================================================

CREATE OR REPLACE VIEW v_dca_scorecard AS
SELECT
    d.id AS dca_id,
    d.name AS dca_name,
    d.region AS dca_region,
    COUNT(c.id) FILTER (WHERE c.status NOT IN ('CLOSED')) AS open_cases,
    COALESCE(SUM(c.amount) FILTER (WHERE c.status NOT IN ('CLOSED')), 0) AS open_amount,
    ROUND(AVG(c.ageing_days) FILTER (WHERE c.status NOT IN ('CLOSED')), 1) AS avg_ageing,
    COUNT(c.id) FILTER (WHERE c.status = 'RECOVERED' OR c.closure_reason = 'RECOVERED') AS recovered_count,
    COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'RECOVERED' OR c.closure_reason = 'RECOVERED'), 0) AS recovered_amount,
    COUNT(c.id) FILTER (WHERE s.breached = TRUE) AS breach_count,
    ROUND(
        COUNT(c.id) FILTER (WHERE s.breached = TRUE)::NUMERIC / 
        NULLIF(COUNT(c.id), 0) * 100,
        1
    ) AS breach_rate_pct,
    COALESCE(
        ROUND(
            AVG(EXTRACT(EPOCH FROM (NOW() - a.last_activity)) / 86400),
            1
        ),
        0
    ) AS avg_days_since_last_activity
FROM dca d
LEFT JOIN cases c ON c.assigned_dca_id = d.id
LEFT JOIN case_sla s ON s.case_id = c.id
LEFT JOIN LATERAL (
    SELECT MAX(created_at) AS last_activity
    FROM case_activity
    WHERE case_id = c.id
) a ON TRUE
GROUP BY d.id, d.name, d.region
ORDER BY open_cases DESC;

-- ====================================================
-- VIEW: v_case_summary (Enriched case list for tables)
-- ====================================================

CREATE OR REPLACE VIEW v_case_summary AS
SELECT
    c.id,
    c.external_ref,
    c.customer_name,
    c.amount,
    c.currency,
    c.ageing_days,
    c.status,
    c.priority_score,
    c.recovery_prob_30d,
    c.reason_codes,
    c.next_action_due_at,
    c.sla_due_at,
    c.created_at,
    c.updated_at,
    d.name AS assigned_dca_name,
    d.id AS assigned_dca_id,
    s.breached AS sla_breached,
    s.escalated AS sla_escalated,
    (
        SELECT COUNT(*)
        FROM case_activity
        WHERE case_id = c.id
    ) AS activity_count,
    (
        SELECT COUNT(*)
        FROM evidence_files
        WHERE case_id = c.id
    ) AS evidence_count
FROM cases c
LEFT JOIN dca d ON c.assigned_dca_id = d.id
LEFT JOIN case_sla s ON s.case_id = c.id;

-- ====================================================
-- VIEW: v_priority_queue (Work queue sorted by priority)
-- ====================================================

CREATE OR REPLACE VIEW v_priority_queue AS
SELECT
    c.id,
    c.external_ref,
    c.customer_name,
    c.amount,
    c.ageing_days,
    c.status,
    c.priority_score,
    c.recovery_prob_30d,
    c.next_action_due_at,
    d.name AS assigned_dca_name,
    CASE
        WHEN c.next_action_due_at < NOW() THEN 'OVERDUE'
        WHEN c.next_action_due_at < NOW() + INTERVAL '1 day' THEN 'DUE_TODAY'
        WHEN c.next_action_due_at < NOW() + INTERVAL '3 days' THEN 'DUE_SOON'
        ELSE 'SCHEDULED'
    END AS urgency
FROM cases c
LEFT JOIN dca d ON c.assigned_dca_id = d.id
WHERE c.status NOT IN ('CLOSED', 'RECOVERED')
ORDER BY
    CASE
        WHEN c.next_action_due_at < NOW() THEN 0
        WHEN c.next_action_due_at < NOW() + INTERVAL '1 day' THEN 1
        ELSE 2
    END,
    c.priority_score DESC NULLS LAST,
    c.ageing_days DESC;

-- ====================================================
-- VIEW: v_recovery_trend (Daily recovery metrics)
-- ====================================================

CREATE OR REPLACE VIEW v_recovery_trend AS
SELECT
    DATE(closed_at) AS recovery_date,
    COUNT(*) AS cases_closed,
    COALESCE(SUM(amount), 0) AS amount_recovered
FROM cases
WHERE status = 'RECOVERED' OR closure_reason = 'RECOVERED'
GROUP BY DATE(closed_at)
ORDER BY recovery_date DESC
LIMIT 30;

-- ====================================================
-- GRANT SELECT on views to authenticated users
-- ====================================================

GRANT SELECT ON v_kpi_overview TO authenticated;
GRANT SELECT ON v_ageing_buckets TO authenticated;
GRANT SELECT ON v_dca_scorecard TO authenticated;
GRANT SELECT ON v_case_summary TO authenticated;
GRANT SELECT ON v_priority_queue TO authenticated;
GRANT SELECT ON v_recovery_trend TO authenticated;

-- ====================================================
-- COMMENTS
-- ====================================================

COMMENT ON VIEW v_kpi_overview IS 'Overall platform KPIs for executive dashboard';
COMMENT ON VIEW v_ageing_buckets IS 'Cases grouped by ageing buckets with amounts';
COMMENT ON VIEW v_dca_scorecard IS 'DCA performance scorecard with key metrics';
COMMENT ON VIEW v_case_summary IS 'Enriched case list with DCA and SLA info';
COMMENT ON VIEW v_priority_queue IS 'Work queue sorted by priority and urgency';
COMMENT ON VIEW v_recovery_trend IS 'Daily recovery metrics for trend charts';
