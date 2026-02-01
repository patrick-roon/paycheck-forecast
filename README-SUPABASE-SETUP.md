# Supabase Setup Guide

This guide will help you set up Supabase authentication and database for your Paycheck Forecast app.

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Node.js installed locally

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Project name: `paycheck-forecast` (or your choice)
   - Database password: Choose a strong password
   - Region: Select closest to you
4. Click "Create new project"
5. Wait for the project to finish setting up (~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (looks like `eyJhbGc...`)

## Step 3: Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "+ New query"
3. Copy the entire contents of `supabase-migration.sql` from your project
4. Paste it into the SQL editor
5. Click "Run" to execute the migration
6. You should see "Success. No rows returned" - this is normal!

This migration creates:
- All necessary tables (profiles, user_configs, bills, expenses, etc.)
- Row Level Security (RLS) policies for data isolation
- Triggers for automatic user initialization

## Step 5: Create User Accounts for Friends

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Click "Add user" > "Create new user"
3. Fill in:
   - Email: Friend's email address
   - Password: Set a temporary password
   - Auto Confirm User: Check this box ✓
4. Click "Create user"
5. **Initialize their data** by going to **SQL Editor** and running:
   ```sql
   SELECT initialize_user_data('user-uuid-from-users-table');
   ```
   (Replace `user-uuid-from-users-table` with the actual UUID from the users table)

6. Share the following with your friend:
   - App URL: Your deployment URL
   - Email: The email you used
   - Password: The temporary password you set

### Option 2: Send Invite Email

1. Go to **Authentication** > **Users**
2. Click "Invite user"
3. Enter their email
4. They'll receive an email to set their password
5. After they sign up, run the initialization SQL from Option 1

## Step 6: Start Your Development Server

```bash
npm run dev
```

Visit http://localhost:3000 - you should be redirected to the login page.

## Testing the Setup

### Test Authentication
1. Navigate to http://localhost:3000
2. You should be redirected to `/login`
3. Try logging in with a created user account
4. You should be redirected to `/dashboard`

### Test Data Isolation
1. Create two test users in Supabase
2. Login as User A and add some bills/expenses
3. Logout and login as User B
4. Verify User B sees their own empty data (no User A data)

### Test CRUD Operations
1. Add bills to both sets
2. Add recurring expenses
3. Add one-time expenses to paychecks
4. Modify bill amounts for specific paychecks
5. Refresh the page - all data should persist

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Your friends can now access the app at your Vercel URL!

## User Management

### Reset a User's Password
1. Go to **Authentication** > **Users** in Supabase
2. Find the user
3. Click "..." menu > "Send password recovery email"

### Delete a User
1. Go to **Authentication** > **Users**
2. Find the user
3. Click "..." menu > "Delete user"
4. All their data (bills, expenses, config) will be automatically deleted (CASCADE)

### View User Data (Admin Only)
1. Go to **Table Editor** in Supabase
2. Select a table (e.g., `bills`, `expenses`)
3. Filter by `user_id` to see a specific user's data

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file
- Make sure you copied the **Anon/Public** key, not the Service Role key
- Restart your dev server after changing `.env.local`

### "Row Level Security policy violation" error
- Ensure RLS policies were created correctly
- Run the migration again if needed
- Check that you're logged in as the correct user

### User can't see their data after signup
- Run the `initialize_user_data('user-id')` function for that user
- Check the `user_configs` table to ensure a config exists

### Data not persisting
- Check browser console for errors
- Verify your Supabase credentials in `.env.local`
- Check Network tab to see if API calls are being made

## Database Schema

Your database has the following tables:

- **profiles** - User profile information
- **user_configs** - Paycheck configuration (frequency, amount, dates)
- **bills** - User's bills (organized into two sets)
- **bill_overrides** - Custom bill amounts for specific paychecks
- **expenses** - One-time expenses per paycheck
- **recurring_expenses** - Expenses applied to every paycheck

All tables have Row Level Security enabled to ensure users only see their own data.

## Default Settings

New users start with:
- Default paycheck amount: **$2,000**
- Pay frequency: **Semi-monthly** (15th and last day, adjusted to Friday)
- **No default bills** - users create their own

## Support

If you encounter issues:
1. Check the Supabase logs: **Logs** > **Postgres Logs** in dashboard
2. Check browser console for JavaScript errors
3. Verify environment variables are set correctly
4. Ensure the migration ran successfully (all tables exist)
