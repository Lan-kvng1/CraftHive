-- 1. Backfill Historical Users
INSERT INTO activity_logs (type, message, sub_message, created_at)
SELECT 
    'user', 
    'New ' || role || ' registered', 
    full_name, 
    created_at
FROM profiles
ON CONFLICT DO NOTHING;

-- 2. Backfill Historical Bookings
INSERT INTO activity_logs (type, message, sub_message, created_at)
SELECT 
    'booking', 
    'New booking created', 
    'Ticket BK-' || UPPER(SUBSTRING(id::text, 1, 8)), 
    created_at
FROM bookings
ON CONFLICT DO NOTHING;

-- 3. Backfill Historical Payments (Only released ones)
INSERT INTO activity_logs (type, message, sub_message, created_at)
SELECT 
    'payment', 
    'Payment released', 
    'GH₵ ' || amount, 
    created_at
FROM payments
WHERE status = 'released'
ON CONFLICT DO NOTHING;

-- 4. Backfill Historical Disputes
INSERT INTO activity_logs (type, message, sub_message, created_at)
SELECT 
    'dispute', 
    'New dispute raised', 
    reason, 
    created_at
FROM disputes
ON CONFLICT DO NOTHING;

-- 5. Backfill Historical Reviews
INSERT INTO activity_logs (type, message, sub_message, created_at)
SELECT 
    'review', 
    rating || '-star review posted', 
    comment, 
    created_at
FROM reviews
ON CONFLICT DO NOTHING;
