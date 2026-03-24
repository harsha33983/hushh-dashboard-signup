-- Seed demo data for Drop-off Intelligence Platform

-- Create demo workspace
INSERT INTO workspaces (id, name, api_key, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Demo E-commerce Store',
  'dk_demo_a1b2c3d4e5f67890',
  NOW() - INTERVAL '30 days'
) ON CONFLICT (api_key) DO NOTHING;

-- Create demo funnel: Checkout Flow
INSERT INTO funnels (id, workspace_id, name, steps, created_at, updated_at)
VALUES (
  'f1e2d3c4-b5a6-7890-1234-567890abcdef',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Checkout Flow',
  '[
    {"name": "Product Viewed", "event_name": "product_viewed", "filters": {}},
    {"name": "Added to Cart", "event_name": "add_to_cart", "filters": {}},
    {"name": "Checkout Started", "event_name": "checkout_started", "filters": {}},
    {"name": "Payment Info Entered", "event_name": "payment_info_entered", "filters": {}},
    {"name": "Order Completed", "event_name": "order_completed", "filters": {}}
  ]'::jsonb,
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '1 day'
) ON CONFLICT DO NOTHING;

-- Create second funnel: Signup Flow
INSERT INTO funnels (id, workspace_id, name, steps, created_at, updated_at)
VALUES (
  'f2e3d4c5-b6a7-8901-2345-678901bcdef0',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'User Signup Flow',
  '[
    {"name": "Landing Page", "event_name": "page_view", "filters": {"page": "/signup"}},
    {"name": "Form Started", "event_name": "signup_form_started", "filters": {}},
    {"name": "Email Entered", "event_name": "signup_email_entered", "filters": {}},
    {"name": "Account Created", "event_name": "signup_completed", "filters": {}}
  ]'::jsonb,
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '3 days'
) ON CONFLICT DO NOTHING;

-- Generate realistic event data using a CTE with generate_series
-- This creates ~5000 events over the last 30 days

WITH sessions AS (
  SELECT 
    'session_' || generate_series AS session_id,
    generate_series AS session_num,
    CASE 
      WHEN random() < 0.6 THEN 'desktop'
      WHEN random() < 0.85 THEN 'mobile'
      ELSE 'tablet'
    END as device,
    CASE 
      WHEN random() < 0.7 THEN 'Chrome'
      WHEN random() < 0.85 THEN 'Safari'
      WHEN random() < 0.95 THEN 'Firefox'
      ELSE 'Edge'
    END as browser,
    CASE WHEN random() < 0.3 THEN 'user_' || (generate_series % 200) ELSE NULL END as user_id,
    NOW() - (random() * INTERVAL '30 days') as session_start
  FROM generate_series(1, 500)
),
funnel_events AS (
  SELECT 
    s.session_id,
    s.user_id,
    s.session_start,
    s.device,
    s.browser,
    e.event_name,
    e.step_order,
    -- Realistic drop-off rates: each step has probability of continuing
    CASE 
      WHEN e.step_order = 1 THEN true  -- Everyone views product
      WHEN e.step_order = 2 THEN random() < 0.65  -- 65% add to cart
      WHEN e.step_order = 3 THEN random() < 0.52  -- 52% of those start checkout
      WHEN e.step_order = 4 THEN random() < 0.70  -- 70% of those enter payment
      WHEN e.step_order = 5 THEN random() < 0.85  -- 85% of those complete order
      ELSE false
    END as should_include
  FROM sessions s
  CROSS JOIN (
    VALUES 
      ('product_viewed', 1),
      ('add_to_cart', 2),
      ('checkout_started', 3),
      ('payment_info_entered', 4),
      ('order_completed', 5)
  ) AS e(event_name, step_order)
)
INSERT INTO events (workspace_id, session_id, user_id, event_name, properties, page_url, timestamp, created_at)
SELECT 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  f.session_id,
  f.user_id,
  f.event_name,
  jsonb_build_object(
    'device', f.device,
    'browser', f.browser,
    'step', f.step_order,
    'value', CASE WHEN f.event_name = 'order_completed' THEN (50 + random() * 200)::int ELSE NULL END
  ),
  CASE f.event_name
    WHEN 'product_viewed' THEN '/products/sample-product'
    WHEN 'add_to_cart' THEN '/products/sample-product'
    WHEN 'checkout_started' THEN '/checkout'
    WHEN 'payment_info_entered' THEN '/checkout/payment'
    WHEN 'order_completed' THEN '/checkout/confirmation'
    ELSE '/'
  END,
  f.session_start + (f.step_order * INTERVAL '2 minutes'),
  f.session_start + (f.step_order * INTERVAL '2 minutes')
FROM funnel_events f
WHERE f.should_include
  AND (f.step_order = 1 OR EXISTS (
    SELECT 1 FROM funnel_events f2 
    WHERE f2.session_id = f.session_id 
    AND f2.step_order = f.step_order - 1 
    AND f2.should_include
  ));

-- Add signup flow events
WITH signup_sessions AS (
  SELECT 
    'signup_session_' || generate_series AS session_id,
    generate_series AS session_num,
    CASE 
      WHEN random() < 0.5 THEN 'desktop'
      WHEN random() < 0.8 THEN 'mobile'
      ELSE 'tablet'
    END as device,
    NOW() - (random() * INTERVAL '30 days') as session_start
  FROM generate_series(1, 300)
),
signup_events AS (
  SELECT 
    s.session_id,
    s.session_start,
    s.device,
    e.event_name,
    e.step_order,
    CASE 
      WHEN e.step_order = 1 THEN true
      WHEN e.step_order = 2 THEN random() < 0.55
      WHEN e.step_order = 3 THEN random() < 0.75
      WHEN e.step_order = 4 THEN random() < 0.80
      ELSE false
    END as should_include
  FROM signup_sessions s
  CROSS JOIN (
    VALUES 
      ('page_view', 1),
      ('signup_form_started', 2),
      ('signup_email_entered', 3),
      ('signup_completed', 4)
  ) AS e(event_name, step_order)
)
INSERT INTO events (workspace_id, session_id, user_id, event_name, properties, page_url, timestamp, created_at)
SELECT 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  f.session_id,
  NULL,
  f.event_name,
  jsonb_build_object('device', f.device, 'page', '/signup'),
  '/signup',
  f.session_start + (f.step_order * INTERVAL '1 minute'),
  f.session_start + (f.step_order * INTERVAL '1 minute')
FROM signup_events f
WHERE f.should_include
  AND (f.step_order = 1 OR EXISTS (
    SELECT 1 FROM signup_events f2 
    WHERE f2.session_id = f.session_id 
    AND f2.step_order = f.step_order - 1 
    AND f2.should_include
  ));

-- Add some sample insights
INSERT INTO funnel_insights (funnel_id, step_index, insight_type, severity, title, description, metadata)
VALUES 
  (
    'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    2,
    'high_drop_off',
    'critical',
    'High drop-off at Checkout Started',
    '48% of users who add items to cart do not proceed to checkout. This is significantly higher than the industry average of 30%.',
    '{"drop_rate": 0.48, "industry_avg": 0.30, "affected_sessions": 175}'::jsonb
  ),
  (
    'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    2,
    'device_correlation',
    'warning',
    'Mobile users drop 2.1x more at checkout',
    'Mobile users have a 62% drop-off rate at checkout compared to 29% for desktop users. Consider optimizing the mobile checkout experience.',
    '{"mobile_drop_rate": 0.62, "desktop_drop_rate": 0.29, "ratio": 2.1}'::jsonb
  ),
  (
    'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    3,
    'time_correlation',
    'info',
    'Payment drop-offs peak on weekday evenings',
    'Users are 35% more likely to abandon during payment info entry between 6-9 PM on weekdays. This may indicate decision fatigue.',
    '{"peak_hours": [18, 19, 20, 21], "peak_days": ["Mon", "Tue", "Wed", "Thu"], "increase_rate": 0.35}'::jsonb
  ),
  (
    'f2e3d4c5-b6a7-8901-2345-678901bcdef0',
    1,
    'high_drop_off',
    'warning',
    'High abandonment at form start',
    '45% of visitors who view the signup page do not start filling the form. Consider simplifying the initial form view or adding social proof.',
    '{"drop_rate": 0.45, "visitors": 300, "form_starters": 165}'::jsonb
  );
