-- Seed Data for Demo
-- ====================================================
-- Creates sample DCAs, users, and cases for demonstration
-- ====================================================

-- ====================================================
-- SEED: DCAs
-- ====================================================

INSERT INTO dca (id, name, region) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Premier Recovery Solutions', 'North'),
    ('22222222-2222-2222-2222-222222222222', 'Apex Collections India', 'South'),
    ('33333333-3333-3333-3333-333333333333', 'National Debt Services', 'West');

-- ====================================================
-- SEED: Demo Users (profiles)
-- Note: You must create these users in Supabase Auth first
-- Then update the IDs below to match the auth.users.id
-- For demo purposes, these are placeholder UUIDs
-- ====================================================

-- In production, create users via Supabase Auth signup
-- Then insert profiles like:
-- INSERT INTO profiles (id, full_name, role, dca_id) VALUES
--     ('auth-user-id-1', 'John Admin', 'fedex_admin', NULL),
--     ('auth-user-id-2', 'Jane Agent', 'fedex_agent', NULL),
--     ('auth-user-id-3', 'DCA Admin 1', 'dca_admin', '11111111-1111-1111-1111-111111111111'),
--     ('auth-user-id-4', 'DCA Agent 1', 'dca_agent', '11111111-1111-1111-1111-111111111111');

-- For demo, we'll create placeholder profiles (these won't work until auth users exist)
-- Comment out or remove after setting up real auth users

-- ====================================================
-- SEED: Sample Cases
-- ====================================================

INSERT INTO cases (
    id,
    external_ref,
    customer_name,
    amount,
    currency,
    ageing_days,
    status,
    assigned_dca_id,
    priority_score,
    recovery_prob_30d,
    reason_codes,
    next_action_due_at,
    sla_due_at,
    created_at
) VALUES
    -- High priority cases
    (
        'c1000000-0000-0000-0000-000000000001',
        'INV-2024-0001',
        'ABC Logistics Pvt Ltd',
        150000.00,
        'INR',
        75,
        'IN_PROGRESS',
        '11111111-1111-1111-1111-111111111111',
        8500.50,
        0.65,
        '["High amount increases priority", "Active PTP increases recovery", "High ageing reduces recovery"]'::jsonb,
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '2 days',
        NOW() - INTERVAL '75 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000002',
        'INV-2024-0002',
        'XYZ Trading Company',
        98000.00,
        'INR',
        45,
        'PTP',
        '22222222-2222-2222-2222-222222222222',
        7200.30,
        0.78,
        '["Active PTP increases recovery", "High amount increases priority", "More contact attempts improve recovery"]'::jsonb,
        NOW() + INTERVAL '3 days',
        NOW() + INTERVAL '5 days',
        NOW() - INTERVAL '45 days'
    ),
    -- Medium priority cases
    (
        'c1000000-0000-0000-0000-000000000003',
        'INV-2024-0003',
        'Global Freight Solutions',
        65000.00,
        'INR',
        120,
        'ESCALATED',
        '11111111-1111-1111-1111-111111111111',
        3200.00,
        0.25,
        '["High ageing reduces recovery", "Days since last update reduces priority"]'::jsonb,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '120 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000004',
        'INV-2024-0004',
        'Metro Shipping Inc',
        42000.00,
        'INR',
        30,
        'ASSIGNED',
        '33333333-3333-3333-3333-333333333333',
        5800.00,
        0.72,
        '["Higher amount increases priority", "More contact attempts improve recovery"]'::jsonb,
        NOW() + INTERVAL '2 days',
        NOW() + INTERVAL '6 days',
        NOW() - INTERVAL '30 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000005',
        'INV-2024-0005',
        'Express Cargo Ltd',
        88000.00,
        'INR',
        55,
        'IN_PROGRESS',
        '22222222-2222-2222-2222-222222222222',
        6400.20,
        0.68,
        '["High amount increases priority", "More contact attempts improve recovery"]'::jsonb,
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '4 days',
        NOW() - INTERVAL '55 days'
    ),
    -- Low priority / new cases
    (
        'c1000000-0000-0000-0000-000000000006',
        'INV-2024-0006',
        'Quick Transport Services',
        18000.00,
        'INR',
        15,
        'NEW',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW() + INTERVAL '7 days',
        NOW() - INTERVAL '15 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000007',
        'INV-2024-0007',
        'Swift Delivery Co',
        25000.00,
        'INR',
        8,
        'VALIDATED',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW() + INTERVAL '6 days',
        NOW() - INTERVAL '8 days'
    ),
    -- Dispute cases
    (
        'c1000000-0000-0000-0000-000000000008',
        'INV-2024-0008',
        'Continental Movers',
        72000.00,
        'INR',
        95,
        'DISPUTE',
        '11111111-1111-1111-1111-111111111111',
        2800.00,
        0.35,
        '["Active dispute reduces recovery", "High ageing reduces recovery"]'::jsonb,
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '1 day',
        NOW() - INTERVAL '95 days'
    ),
    -- Recovered cases
    (
        'c1000000-0000-0000-0000-000000000009',
        'INV-2024-0009',
        'Nationwide Logistics',
        55000.00,
        'INR',
        40,
        'RECOVERED',
        '22222222-2222-2222-2222-222222222222',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '40 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000010',
        'INV-2024-0010',
        'City Express',
        32000.00,
        'INR',
        28,
        'RECOVERED',
        '33333333-3333-3333-3333-333333333333',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '28 days'
    ),
    -- More variety
    (
        'c1000000-0000-0000-0000-000000000011',
        'INV-2024-0011',
        'International Freight',
        125000.00,
        'INR',
        110,
        'ESCALATED',
        '11111111-1111-1111-1111-111111111111',
        2500.00,
        0.20,
        '["High ageing reduces recovery", "High amount increases priority"]'::jsonb,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '110 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000012',
        'INV-2024-0012',
        'Regional Transport',
        38000.00,
        'INR',
        22,
        'IN_PROGRESS',
        '22222222-2222-2222-2222-222222222222',
        5200.00,
        0.75,
        '["More contact attempts improve recovery"]'::jsonb,
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '5 days',
        NOW() - INTERVAL '22 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000013',
        'INV-2024-0013',
        'Prime Shipping',
        95000.00,
        'INR',
        62,
        'PTP',
        '33333333-3333-3333-3333-333333333333',
        6800.00,
        0.80,
        '["Active PTP increases recovery", "High amount increases priority"]'::jsonb,
        NOW() + INTERVAL '4 days',
        NOW() + INTERVAL '3 days',
        NOW() - INTERVAL '62 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000014',
        'INV-2024-0014',
        'Delta Cargo',
        48000.00,
        'INR',
        18,
        'ASSIGNED',
        '11111111-1111-1111-1111-111111111111',
        6500.00,
        0.82,
        '["More contact attempts improve recovery"]'::jsonb,
        NOW() + INTERVAL '2 days',
        NOW() + INTERVAL '6 days',
        NOW() - INTERVAL '18 days'
    ),
    (
        'c1000000-0000-0000-0000-000000000015',
        'INV-2024-0015',
        'Omega Logistics',
        15000.00,
        'INR',
        5,
        'NEW',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW() + INTERVAL '7 days',
        NOW() - INTERVAL '5 days'
    );

-- Update case closure info for recovered cases
UPDATE cases SET closure_reason = 'RECOVERED', closed_at = created_at + INTERVAL '35 days'
WHERE id IN ('c1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000010');

-- ====================================================
-- SEED: Sample Activities
-- ====================================================

-- Note: These require valid actor_user_id from profiles
-- For demo, we'll use placeholder UUID - replace with actual user IDs
-- Example activities for case 1

-- Uncomment and update user IDs after creating auth users:
/*
INSERT INTO case_activity (case_id, actor_user_id, actor_role, activity_type, payload) VALUES
    (
        'c1000000-0000-0000-0000-000000000001',
        'auth-user-id-4',  -- Replace with actual DCA agent user ID
        'dca_agent',
        'CONTACT_ATTEMPT',
        '{"contact_date": "2024-01-15", "contact_method": "phone", "outcome": "no_answer", "notes": "Called customer, no response"}'::jsonb
    ),
    (
        'c1000000-0000-0000-0000-000000000001',
        'auth-user-id-4',
        'dca_agent',
        'CONTACT_ATTEMPT',
        '{"contact_date": "2024-01-17", "contact_method": "email", "outcome": "responded", "notes": "Customer acknowledged debt"}'::jsonb
    ),
    (
        'c1000000-0000-0000-0000-000000000001',
        'auth-user-id-4',
        'dca_agent',
        'PTP_CREATED',
        '{"ptp_date": "2024-02-01", "ptp_amount": 75000.00, "notes": "Customer committed to partial payment"}'::jsonb
    ),
    (
        'c1000000-0000-0000-0000-000000000002',
        'auth-user-id-4',
        'dca_agent',
        'CONTACT_ATTEMPT',
        '{"contact_date": "2024-01-10", "contact_method": "phone", "outcome": "spoke_to_customer", "notes": "Discussed payment plan"}'::jsonb
    ),
    (
        'c1000000-0000-0000-0000-000000000002',
        'auth-user-id-4',
        'dca_agent',
        'PTP_CREATED',
        '{"ptp_date": "2024-01-25", "ptp_amount": 98000.00, "notes": "Full payment promised"}'::jsonb
    );
*/

-- ====================================================
-- COMMENTS
-- ====================================================

COMMENT ON TABLE dca IS 'Seeded with 3 sample DCAs';
COMMENT ON TABLE cases IS 'Seeded with 15 sample cases across various statuses';
