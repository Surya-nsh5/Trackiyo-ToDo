-- ==================================================
-- DATABASE OPTIMIZATIONS: INDEXES
-- ==================================================

-- Tasks Table Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON public.tasks(user_id, created_at DESC);

-- Habits Table Indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_order_index ON public.habits(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_habits_user_order ON public.habits(user_id, order_index ASC);

-- Habit Logs Table Indexes
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_log_date ON public.habit_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);

-- Wellness Table Indexes
CREATE INDEX IF NOT EXISTS idx_wellness_user_id ON public.wellness(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_log_date ON public.wellness(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_user_date ON public.wellness(user_id, log_date DESC);

-- ==================================================
-- SUPABASE REALTIME CONFIGURATION
-- ==================================================

-- Alter tables to send full old record on UPDATE/DELETE
-- This is critical for frontend state management to know exactly what was changed/deleted
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.habits REPLICA IDENTITY FULL;
ALTER TABLE public.habit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.wellness REPLICA IDENTITY FULL;

-- Create the supabase_realtime publication if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wellness;
