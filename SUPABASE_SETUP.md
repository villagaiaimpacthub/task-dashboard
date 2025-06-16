# Supabase Setup Guide for Hive Task Dashboard

## Prerequisites
- Supabase account with a project created
- Project URL: `https://ivmncixhyicyirtuljtm.supabase.co`
- Service Role Key: `sbp_5cce91459f7466ebb329aac95f365d52e3abdf27`

## Step 1: Create Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `/hive-backend-alpha/create_schema.sql`
4. Click **Run** to execute the SQL script

This will create:
- All necessary tables with proper PostgreSQL data types
- JSONB columns for flexible data storage
- Indexes for optimized query performance
- UUID primary keys for all tables
- Automatic timestamp triggers
- Row Level Security (RLS) enabled on all tables
- A sample admin user (email: `admin@example.com`, password: `admin123`)

## Step 2: Configure Row Level Security (RLS) Policies

Since RLS is enabled, you'll need to create policies. Here are some basic policies to get started:

```sql
-- Allow authenticated users to read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow authenticated users to view all projects
CREATE POLICY "Authenticated users can view projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to create projects
CREATE POLICY "Authenticated users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow project owners to update their projects
CREATE POLICY "Project owners can update" ON projects
    FOR UPDATE USING (auth.uid()::text = owner_id::text);

-- Similar policies for other tables...
```

## Step 3: Update Environment Variables

The `.env` file has been configured with:
```env
DATABASE_URL=postgresql+asyncpg://postgres.ivmncixhyicyirtuljtm:sbp_5cce91459f7466ebb329aac95f365d52e3abdf27@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://ivmncixhyicyirtuljtm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbp_5cce91459f7466ebb329aac95f365d52e3abdf27
```

## Step 4: Key Features Enabled

### 1. **JSONB Columns**
All JSON fields have been converted to JSONB for better performance:
- `users.skills`
- `projects.success_metrics`, `deliverables`, `dependencies`, `required_skills`, `definition_of_done`
- `tasks.required_skills`, `dependencies`, `success_metrics`, `deliverables`

### 2. **GIN Indexes**
GIN (Generalized Inverted Index) indexes on JSONB columns enable efficient searches:
```sql
-- Example: Find users with specific skills
SELECT * FROM users WHERE skills @> '["Python"]';

-- Example: Find tasks requiring specific skills
SELECT * FROM tasks WHERE required_skills @> '["React", "TypeScript"]';
```

### 3. **Automatic Timestamps**
All tables have triggers that automatically update the `updated_at` timestamp on any row modification.

### 4. **UUID Primary Keys**
All tables use UUID primary keys for better distributed system compatibility.

## Step 5: Optional Supabase Features

### Realtime Subscriptions
Enable realtime on tables for live updates:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### Storage Integration
For file uploads, consider using Supabase Storage:
1. Go to Storage in your Supabase dashboard
2. Create a bucket named `task-files`
3. Update the `task_files` table to store Supabase Storage URLs instead of local paths

## Step 6: Testing the Connection

Run this Python script to test the connection:

```python
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def test_connection():
    DATABASE_URL = "postgresql+asyncpg://postgres.ivmncixhyicyirtuljtm:sbp_5cce91459f7466ebb329aac95f365d52e3abdf27@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.connect() as conn:
        result = await conn.execute("SELECT 1")
        print("Connection successful!")
        print(f"Result: {result.scalar()}")
    
    await engine.dispose()

asyncio.run(test_connection())
```

## Step 7: Running the Application

1. Install dependencies:
   ```bash
   cd hive-backend-alpha
   poetry install  # or pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

## Migration Notes

The codebase has been updated to be fully PostgreSQL/Supabase compatible:
- All models use JSONB instead of JSON
- Strategic indexes added for performance
- Test configuration updated to support PostgreSQL
- Database configuration reads from environment variables

## Security Considerations

1. **Change the admin password** immediately after setup
2. **Update the SECRET_KEY** in `.env` for JWT token generation
3. **Configure proper RLS policies** based on your security requirements
4. **Use environment variables** for all sensitive configuration
5. **Enable 2FA** on your Supabase account

## Troubleshooting

1. **Connection Issues**: Ensure your IP is whitelisted in Supabase settings
2. **Permission Errors**: Check RLS policies are correctly configured
3. **Migration Errors**: Ensure all extensions are enabled (especially uuid-ossp)
4. **Performance Issues**: Monitor query performance and add indexes as needed