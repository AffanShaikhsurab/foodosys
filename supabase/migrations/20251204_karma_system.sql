-- =========================================
-- Karma System Enhancement Migration
-- =========================================
-- This migration adds support for:
-- 1. Meal session tracking (breakfast/lunch/dinner)
-- 2. Karma transactions for detailed audit trail
-- 3. Consecutive upload bonuses
-- 4. Abuse prevention mechanisms
-- =========================================

-- Add meal_session column to daily_contributions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_contributions' AND column_name = 'meal_session'
    ) THEN
        ALTER TABLE daily_contributions ADD COLUMN meal_session TEXT CHECK (meal_session IN ('breakfast', 'lunch', 'dinner'));
    END IF;
END $$;

-- Create karma_transactions table for detailed tracking
CREATE TABLE IF NOT EXISTS karma_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'upload',           -- Base upload points
        'consecutive_bonus', -- Bonus for uploading in consecutive meal sessions
        'daily_streak',     -- Bonus for uploading all 3 meals in a day
        'weekly_streak',    -- Bonus for 7 consecutive days
        'first_upload_day', -- First upload of the day bonus
        'edit',             -- Edit contribution points
        'verify'            -- Verification points
    )),
    reason TEXT,
    related_image_id UUID REFERENCES menu_images(id) ON DELETE SET NULL,
    meal_session TEXT CHECK (meal_session IN ('breakfast', 'lunch', 'dinner')),
    streak_count INTEGER DEFAULT 0, -- For tracking streak length
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_karma_transactions_user_id ON karma_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_transactions_created_at ON karma_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_karma_transactions_type ON karma_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_daily_contributions_meal_session ON daily_contributions(meal_session);
CREATE INDEX IF NOT EXISTS idx_daily_contributions_user_date ON daily_contributions(user_id, contribution_date);

-- Enable RLS on karma_transactions
ALTER TABLE karma_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for karma_transactions
DROP POLICY IF EXISTS karma_transactions_select_public ON karma_transactions;
CREATE POLICY karma_transactions_select_public ON karma_transactions FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS karma_transactions_insert_service ON karma_transactions;
CREATE POLICY karma_transactions_insert_service ON karma_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- =========================================
-- Karma Calculation Functions
-- =========================================

-- Function to determine meal session from timestamp
CREATE OR REPLACE FUNCTION get_meal_session(ts TIMESTAMPTZ DEFAULT NOW())
RETURNS TEXT AS $$
DECLARE
    hour_of_day INTEGER;
BEGIN
    -- Extract hour in the local timezone (IST - UTC+5:30)
    hour_of_day := EXTRACT(HOUR FROM ts AT TIME ZONE 'Asia/Kolkata');
    
    -- Breakfast: 6 AM - 11 AM
    IF hour_of_day >= 6 AND hour_of_day < 11 THEN
        RETURN 'breakfast';
    -- Lunch: 11 AM - 4 PM
    ELSIF hour_of_day >= 11 AND hour_of_day < 16 THEN
        RETURN 'lunch';
    -- Dinner: 4 PM - 10 PM
    ELSIF hour_of_day >= 16 AND hour_of_day < 22 THEN
        RETURN 'dinner';
    ELSE
        RETURN NULL; -- Off-hours, still counts but no meal session bonus
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check for consecutive meal session upload
CREATE OR REPLACE FUNCTION check_consecutive_bonus(
    user_profile_id UUID,
    current_session TEXT,
    check_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
    previous_session TEXT;
    has_previous BOOLEAN;
    bonus_points INTEGER := 0;
BEGIN
    -- Determine the previous meal session
    IF current_session = 'lunch' THEN
        previous_session := 'breakfast';
    ELSIF current_session = 'dinner' THEN
        previous_session := 'lunch';
    ELSE
        -- Breakfast has no previous session on same day
        RETURN 0;
    END IF;
    
    -- Check if user has an upload in the previous session today
    SELECT EXISTS (
        SELECT 1 FROM daily_contributions
        WHERE user_id = user_profile_id
        AND contribution_date = check_date
        AND meal_session = previous_session
        AND contribution_type = 'upload'
    ) INTO has_previous;
    
    IF has_previous THEN
        bonus_points := 5; -- Consecutive meal bonus
    END IF;
    
    RETURN bonus_points;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check for daily streak (all 3 meals uploaded)
CREATE OR REPLACE FUNCTION check_daily_streak_bonus(
    user_profile_id UUID,
    check_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
    meal_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT meal_session)
    INTO meal_count
    FROM daily_contributions
    WHERE user_id = user_profile_id
    AND contribution_date = check_date
    AND meal_session IS NOT NULL
    AND contribution_type = 'upload';
    
    -- If all 3 meals are now complete, award daily streak bonus
    IF meal_count = 3 THEN
        -- Check if bonus was already awarded today
        IF NOT EXISTS (
            SELECT 1 FROM karma_transactions
            WHERE user_id = user_profile_id
            AND transaction_type = 'daily_streak'
            AND created_at::DATE = check_date
        ) THEN
            RETURN 15; -- Daily streak bonus
        END IF;
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check for weekly streak (7 consecutive days)
CREATE OR REPLACE FUNCTION check_weekly_streak_bonus(user_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
    consecutive_days INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    has_upload BOOLEAN;
BEGIN
    -- Count consecutive days going backwards
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM daily_contributions
            WHERE user_id = user_profile_id
            AND contribution_date = check_date
            AND contribution_type = 'upload'
        ) INTO has_upload;
        
        IF has_upload THEN
            consecutive_days := consecutive_days + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
        
        -- Stop checking after 7 days
        IF consecutive_days >= 7 THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Award weekly streak bonus if 7 consecutive days reached
    IF consecutive_days >= 7 THEN
        -- Check if bonus was already awarded this week
        IF NOT EXISTS (
            SELECT 1 FROM karma_transactions
            WHERE user_id = user_profile_id
            AND transaction_type = 'weekly_streak'
            AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        ) THEN
            RETURN 50; -- Weekly streak bonus
        END IF;
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check first upload of the day bonus
CREATE OR REPLACE FUNCTION check_first_upload_bonus(
    user_profile_id UUID,
    check_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
    upload_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO upload_count
    FROM daily_contributions
    WHERE user_id = user_profile_id
    AND contribution_date = check_date
    AND contribution_type = 'upload';
    
    -- First upload of the day
    IF upload_count = 1 THEN
        RETURN 2; -- Small bonus for first upload
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comprehensive karma awarding function
CREATE OR REPLACE FUNCTION award_karma_with_bonus(
    user_profile_id UUID,
    p_image_id UUID,
    base_points INTEGER DEFAULT 10
) RETURNS TABLE(
    total_points INTEGER,
    base_earned INTEGER,
    consecutive_bonus INTEGER,
    first_upload_bonus INTEGER,
    daily_streak_bonus INTEGER,
    weekly_streak_bonus INTEGER
) AS $$
DECLARE
    v_meal_session TEXT;
    v_consecutive INTEGER := 0;
    v_first_upload INTEGER := 0;
    v_daily_streak INTEGER := 0;
    v_weekly_streak INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    -- Get current meal session
    v_meal_session := get_meal_session();
    
    -- Check for consecutive bonus
    IF v_meal_session IS NOT NULL THEN
        v_consecutive := check_consecutive_bonus(user_profile_id, v_meal_session);
    END IF;
    
    -- Check for first upload bonus
    v_first_upload := check_first_upload_bonus(user_profile_id);
    
    -- Check for daily streak bonus
    v_daily_streak := check_daily_streak_bonus(user_profile_id);
    
    -- Check for weekly streak bonus
    v_weekly_streak := check_weekly_streak_bonus(user_profile_id);
    
    -- Calculate total
    v_total := base_points + v_consecutive + v_first_upload + v_daily_streak + v_weekly_streak;
    
    -- Insert karma transactions for each bonus type
    INSERT INTO karma_transactions (user_id, points, transaction_type, reason, related_image_id, meal_session)
    VALUES (user_profile_id, base_points, 'upload', 'Photo upload', p_image_id, v_meal_session);
    
    IF v_consecutive > 0 THEN
        INSERT INTO karma_transactions (user_id, points, transaction_type, reason, related_image_id, meal_session)
        VALUES (user_profile_id, v_consecutive, 'consecutive_bonus', 'Consecutive meal upload bonus', p_image_id, v_meal_session);
    END IF;
    
    IF v_first_upload > 0 THEN
        INSERT INTO karma_transactions (user_id, points, transaction_type, reason, related_image_id, meal_session)
        VALUES (user_profile_id, v_first_upload, 'first_upload_day', 'First upload of the day', p_image_id, v_meal_session);
    END IF;
    
    IF v_daily_streak > 0 THEN
        INSERT INTO karma_transactions (user_id, points, transaction_type, reason, related_image_id, meal_session)
        VALUES (user_profile_id, v_daily_streak, 'daily_streak', 'All meals uploaded today!', p_image_id, v_meal_session);
    END IF;
    
    IF v_weekly_streak > 0 THEN
        INSERT INTO karma_transactions (user_id, points, transaction_type, reason, related_image_id, meal_session, streak_count)
        VALUES (user_profile_id, v_weekly_streak, 'weekly_streak', '7 day upload streak!', p_image_id, v_meal_session, 7);
    END IF;
    
    -- Update user's total karma and level
    UPDATE user_profiles
    SET 
        karma_points = karma_points + v_total,
        level = CASE
            WHEN karma_points + v_total >= 2000 THEN 5
            WHEN karma_points + v_total >= 1500 THEN 4
            WHEN karma_points + v_total >= 1000 THEN 3
            WHEN karma_points + v_total >= 500 THEN 2
            ELSE 1
        END,
        updated_at = NOW()
    WHERE id = user_profile_id;
    
    -- Update leaderboard
    INSERT INTO leaderboard (user_id, total_karma, weekly_karma, monthly_karma, last_updated)
    VALUES (user_profile_id, 
            (SELECT karma_points FROM user_profiles WHERE id = user_profile_id),
            v_total, 
            v_total, 
            NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET 
        total_karma = (SELECT karma_points FROM user_profiles WHERE id = user_profile_id),
        weekly_karma = leaderboard.weekly_karma + EXCLUDED.weekly_karma,
        monthly_karma = leaderboard.monthly_karma + EXCLUDED.monthly_karma,
        last_updated = NOW();
    
    -- Update leaderboard rankings
    PERFORM update_leaderboard_rankings();
    
    -- Award badges
    PERFORM award_badges(user_profile_id, 'upload');
    
    -- Return breakdown
    base_earned := base_points;
    consecutive_bonus := v_consecutive;
    first_upload_bonus := v_first_upload;
    daily_streak_bonus := v_daily_streak;
    weekly_streak_bonus := v_weekly_streak;
    total_points := v_total;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- Abuse Prevention Functions
-- =========================================

-- Function to check upload rate limiting
CREATE OR REPLACE FUNCTION check_upload_rate_limit(
    user_profile_id UUID,
    p_restaurant_id UUID
) RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT,
    cooldown_remaining INTEGER
) AS $$
DECLARE
    v_meal_session TEXT;
    v_last_upload TIMESTAMPTZ;
    v_session_count INTEGER;
    v_cooldown_seconds INTEGER := 300; -- 5 minute cooldown
    v_max_per_session INTEGER := 3; -- Max 3 uploads per meal session
BEGIN
    v_meal_session := get_meal_session();
    
    -- Check cooldown (minimum 5 minutes between uploads)
    SELECT created_at 
    INTO v_last_upload
    FROM daily_contributions
    WHERE user_id = user_profile_id
    AND contribution_type = 'upload'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_last_upload IS NOT NULL AND (NOW() - v_last_upload) < (v_cooldown_seconds || ' seconds')::INTERVAL THEN
        allowed := FALSE;
        reason := 'Please wait before uploading again. Cooldown active.';
        cooldown_remaining := v_cooldown_seconds - EXTRACT(EPOCH FROM (NOW() - v_last_upload))::INTEGER;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Check session upload limit
    IF v_meal_session IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_session_count
        FROM daily_contributions
        WHERE user_id = user_profile_id
        AND contribution_date = CURRENT_DATE
        AND meal_session = v_meal_session
        AND contribution_type = 'upload';
        
        IF v_session_count >= v_max_per_session THEN
            allowed := FALSE;
            reason := 'Maximum uploads reached for this meal session. Try again later.';
            cooldown_remaining := 0;
            RETURN NEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Check if already uploaded to this restaurant this session
    IF v_meal_session IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM daily_contributions dc
            JOIN menu_images mi ON dc.menu_image_id = mi.id
            WHERE dc.user_id = user_profile_id
            AND dc.contribution_date = CURRENT_DATE
            AND dc.meal_session = v_meal_session
            AND mi.restaurant_id = p_restaurant_id
            AND dc.contribution_type = 'upload'
        ) THEN
            allowed := FALSE;
            reason := 'You already uploaded a menu for this restaurant in the current meal session.';
            cooldown_remaining := 0;
            RETURN NEXT;
            RETURN;
        END IF;
    END IF;
    
    -- All checks passed
    allowed := TRUE;
    reason := NULL;
    cooldown_remaining := 0;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- =========================================
-- Update existing trigger to use new system
-- =========================================

-- Drop the old trigger (we'll handle karma in the API now)
DROP TRIGGER IF EXISTS trigger_award_points ON daily_contributions;

-- Create a simpler trigger that just tracks the contribution
CREATE OR REPLACE FUNCTION on_contribution_created_v2() RETURNS TRIGGER AS $$
BEGIN
    -- Just update the meal_session if not already set
    IF NEW.meal_session IS NULL THEN
        NEW.meal_session := get_meal_session(NEW.created_at);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_meal_session ON daily_contributions;
CREATE TRIGGER trigger_set_meal_session
    BEFORE INSERT ON daily_contributions
    FOR EACH ROW
    EXECUTE FUNCTION on_contribution_created_v2();

-- =========================================
-- Get user karma stats function
-- =========================================

CREATE OR REPLACE FUNCTION get_user_karma_stats(user_profile_id UUID)
RETURNS TABLE(
    total_karma INTEGER,
    user_level INTEGER,
    weekly_karma BIGINT,
    monthly_karma BIGINT,
    total_uploads BIGINT,
    current_streak INTEGER,
    rank_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.karma_points,
        up.level,
        COALESCE(SUM(CASE WHEN kt.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN kt.points ELSE 0 END), 0)::BIGINT,
        COALESCE(SUM(CASE WHEN kt.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN kt.points ELSE 0 END), 0)::BIGINT,
        (SELECT COUNT(*) FROM daily_contributions WHERE user_id = user_profile_id AND contribution_type = 'upload')::BIGINT,
        (SELECT COUNT(DISTINCT contribution_date)::INTEGER 
         FROM daily_contributions 
         WHERE user_id = user_profile_id 
         AND contribution_type = 'upload'
         AND contribution_date >= (
             SELECT COALESCE(
                 (SELECT contribution_date + INTERVAL '1 day' 
                  FROM (
                      SELECT contribution_date 
                      FROM daily_contributions 
                      WHERE user_id = user_profile_id 
                      ORDER BY contribution_date DESC
                  ) dates
                  WHERE NOT EXISTS (
                      SELECT 1 FROM daily_contributions d2 
                      WHERE d2.user_id = user_profile_id 
                      AND d2.contribution_date = dates.contribution_date - INTERVAL '1 day'
                  )
                  LIMIT 1
                 ), 
                 '1970-01-01'::DATE
             )
         )),
        lb.rank_position
    FROM user_profiles up
    LEFT JOIN karma_transactions kt ON kt.user_id = up.id
    LEFT JOIN leaderboard lb ON lb.user_id = up.id
    WHERE up.id = user_profile_id
    GROUP BY up.karma_points, up.level, lb.rank_position;
END;
$$ LANGUAGE plpgsql STABLE;

-- =========================================
-- Comments for documentation
-- =========================================

COMMENT ON TABLE karma_transactions IS 'Tracks all karma point transactions for audit trail';
COMMENT ON FUNCTION get_meal_session IS 'Returns current meal session (breakfast/lunch/dinner) based on IST time';
COMMENT ON FUNCTION check_consecutive_bonus IS 'Checks if user uploaded in previous meal session for consecutive bonus';
COMMENT ON FUNCTION award_karma_with_bonus IS 'Main function to award karma with all applicable bonuses';
COMMENT ON FUNCTION check_upload_rate_limit IS 'Abuse prevention: checks upload limits and cooldowns';
