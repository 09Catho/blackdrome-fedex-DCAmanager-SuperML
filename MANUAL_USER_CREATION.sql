-- MANUAL USER CREATION FOR DEMO
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vgetykvrcjnpzfkonnwf/editor

-- 1. First, let's clean up any existing test users
DELETE FROM public.profiles WHERE full_name IN ('FedEx Admin', 'DCA Agent', 'DCA Agent 1');

-- 2. Now we'll create users using Supabase's auth.users table properly
-- Password for both users will be: password123
-- This is the bcrypt hash for "password123"
-- You can generate new hashes at: https://bcrypt-generator.com/

-- Create FedEx Admin user
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    is_sso_user,
    is_anonymous
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@fedex.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"FedEx Admin"}',
    FALSE,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    FALSE,
    FALSE
) RETURNING id, email;

-- Note the user ID returned above, then use it to create the profile
-- Replace 'USER_ID_FROM_ABOVE' with the actual UUID returned

-- Create profile for FedEx Admin
-- INSERT INTO public.profiles (id, full_name, role, dca_id) 
-- VALUES ('USER_ID_FROM_ABOVE', 'FedEx Admin', 'fedex_admin', NULL);

-- BETTER APPROACH: Use this single query that does both at once:
-- Run this after getting the user ID from the first insert

WITH new_user AS (
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role,
        aud,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        is_sso_user,
        is_anonymous
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'admin@fedex.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"FedEx Admin"}',
        FALSE,
        'authenticated',
        'authenticated',
        '',
        '',
        '',
        FALSE,
        FALSE
    )
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id, email
)
INSERT INTO public.profiles (id, full_name, role, dca_id)
SELECT id, 'FedEx Admin', 'fedex_admin', NULL
FROM new_user
ON CONFLICT (id) DO NOTHING;

-- Create identity for FedEx Admin
WITH admin_user AS (
    SELECT id FROM auth.users WHERE email = 'admin@fedex.com' LIMIT 1
)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    jsonb_build_object('sub', id::text, 'email', 'admin@fedex.com', 'email_verified', true),
    'email',
    id::text,
    NOW(),
    NOW(),
    NOW()
FROM admin_user
ON CONFLICT DO NOTHING;

-- Create DCA Agent user with identity
WITH new_user AS (
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role,
        aud,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        is_sso_user,
        is_anonymous
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'agent@dca1.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"DCA Agent"}',
        FALSE,
        'authenticated',
        'authenticated',
        '',
        '',
        '',
        FALSE,
        FALSE
    )
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id, email
)
INSERT INTO public.profiles (id, full_name, role, dca_id)
SELECT id, 'DCA Agent', 'dca_agent', '11111111-1111-1111-1111-111111111111'
FROM new_user
ON CONFLICT (id) DO NOTHING;

-- Create identity for DCA Agent
WITH agent_user AS (
    SELECT id FROM auth.users WHERE email = 'agent@dca1.com' LIMIT 1
)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    jsonb_build_object('sub', id::text, 'email', 'agent@dca1.com', 'email_verified', true),
    'email',
    id::text,
    NOW(),
    NOW(),
    NOW()
FROM agent_user
ON CONFLICT DO NOTHING;

-- Verify the users were created
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.role,
    p.dca_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('admin@fedex.com', 'agent@dca1.com');
