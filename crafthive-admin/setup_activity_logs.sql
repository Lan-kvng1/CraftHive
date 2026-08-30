-- 1. Create the Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    message text NOT NULL,
    sub_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Allow read/insert)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activity logs viewable by admin" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Activity logs insertable by everyone" ON activity_logs FOR INSERT WITH CHECK (true);


-- 2. Trigger for Profile Creation (User signs up)
CREATE OR REPLACE FUNCTION log_profile_creation() RETURNS trigger AS $$
BEGIN
  INSERT INTO activity_logs (type, message, sub_message)
  VALUES ('user', 'New ' || NEW.role || ' registered', NEW.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_profile_creation ON profiles;
CREATE TRIGGER trigger_log_profile_creation
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION log_profile_creation();


-- 3. Trigger for Profile Deletion (Admin deletes user)
CREATE OR REPLACE FUNCTION log_profile_deletion() RETURNS trigger AS $$
BEGIN
  INSERT INTO activity_logs (type, message, sub_message)
  VALUES ('admin', 'User deleted by admin', OLD.full_name || ' (' || OLD.role || ')');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_profile_deletion ON profiles;
CREATE TRIGGER trigger_log_profile_deletion
BEFORE DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION log_profile_deletion();


-- 4. Trigger for Bookings Created
CREATE OR REPLACE FUNCTION log_booking_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO activity_logs (type, message, sub_message)
  VALUES ('booking', 'New booking created', 'Ticket BK-' || UPPER(SUBSTRING(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_booking_insert ON bookings;
CREATE TRIGGER trigger_log_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION log_booking_insert();


-- 5. Trigger for Payments Released
CREATE OR REPLACE FUNCTION log_payment_release() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    INSERT INTO activity_logs (type, message, sub_message)
    VALUES ('payment', 'Payment released', 'GH₵ ' || NEW.amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_payment_release ON payments;
CREATE TRIGGER trigger_log_payment_release
AFTER UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION log_payment_release();


-- 6. Trigger for Disputes Raised
CREATE OR REPLACE FUNCTION log_dispute_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO activity_logs (type, message, sub_message)
  VALUES ('dispute', 'New dispute raised', NEW.reason);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_dispute_insert ON disputes;
CREATE TRIGGER trigger_log_dispute_insert
AFTER INSERT ON disputes
FOR EACH ROW EXECUTE FUNCTION log_dispute_insert();


-- 7. Trigger for Reviews Posted
CREATE OR REPLACE FUNCTION log_review_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO activity_logs (type, message, sub_message)
  VALUES ('review', NEW.rating || '-star review posted', NEW.comment);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_review_insert ON reviews;
CREATE TRIGGER trigger_log_review_insert
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION log_review_insert();
