-- Supabase Database Migration for Paycheck Forecast App
-- Run this SQL in your Supabase SQL Editor

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_configs table (paycheck configuration)
CREATE TABLE user_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'bi-weekly', 'semi-monthly', 'monthly')),
  start_date DATE NOT NULL,
  day_of_week INTEGER,
  semi_monthly_days INTEGER[],
  adjust_to_nearest_weekday BOOLEAN DEFAULT false,
  default_amount DECIMAL(10,2) NOT NULL DEFAULT 2000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create bills table (user's bills in both sets)
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bill_set INTEGER NOT NULL CHECK (bill_set IN (1, 2)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, bill_set)
);

-- Create bill_overrides table (custom amounts per paycheck per bill)
CREATE TABLE bill_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_name TEXT NOT NULL,
  paycheck_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bill_name, paycheck_date)
);

-- Create expenses table (one-time expenses)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paycheck_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recurring_expenses table (expenses applied to every paycheck)
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_configs
CREATE POLICY "Users can view own config" ON user_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config" ON user_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config" ON user_configs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for bills
CREATE POLICY "Users can view own bills" ON bills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills" ON bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills" ON bills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills" ON bills
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bill_overrides
CREATE POLICY "Users can view own bill overrides" ON bill_overrides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bill overrides" ON bill_overrides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bill overrides" ON bill_overrides
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bill overrides" ON bill_overrides
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recurring_expenses
CREATE POLICY "Users can view own recurring expenses" ON recurring_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring expenses" ON recurring_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring expenses" ON recurring_expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring expenses" ON recurring_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Initialize default config for new users (no default bills)
CREATE OR REPLACE FUNCTION public.initialize_user_data(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert default config with $2000 default paycheck amount
  INSERT INTO user_configs (user_id, frequency, start_date, semi_monthly_days, adjust_to_nearest_weekday, default_amount)
  VALUES (p_user_id, 'semi-monthly', CURRENT_DATE, ARRAY[15, 0], true, 2000.00)
  ON CONFLICT (user_id) DO NOTHING;

  -- No default bills - users start with empty bill sets
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Call this function manually after creating a user to initialize their data
-- SELECT initialize_user_data('user-uuid-here');
