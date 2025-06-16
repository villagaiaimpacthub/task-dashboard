-- PostgreSQL schema for Hive Task Dashboard
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE messagetype AS ENUM ('direct', 'task', 'broadcast');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    impact_score INTEGER NOT NULL DEFAULT 0,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMPTZ
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_skills_gin ON users USING gin(skills);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR NOT NULL,
    description TEXT,
    objective TEXT,
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    impact_level VARCHAR NOT NULL DEFAULT 'medium',
    visibility_level VARCHAR NOT NULL DEFAULT 'team',
    category VARCHAR NOT NULL DEFAULT 'general',
    status VARCHAR NOT NULL DEFAULT 'planning',
    priority VARCHAR NOT NULL DEFAULT 'medium',
    success_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    definition_of_done JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner_id UUID REFERENCES users(id),
    assignee_id UUID REFERENCES users(id),
    time_investment_hours INTEGER NOT NULL DEFAULT 0,
    value_delivery_score INTEGER NOT NULL DEFAULT 0,
    actual_completion_date TIMESTAMPTZ
);

-- Create indexes for projects
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_assignee_id ON projects(assignee_id);
CREATE INDEX idx_projects_due_date ON projects(due_date);
CREATE INDEX idx_projects_required_skills_gin ON projects USING gin(required_skills);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR NOT NULL DEFAULT 'todo',
    priority VARCHAR NOT NULL DEFAULT 'medium',
    category VARCHAR NOT NULL DEFAULT 'general',
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    estimated_hours FLOAT,
    actual_hours FLOAT,
    success_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_investment_hours INTEGER NOT NULL DEFAULT 0,
    value_delivery_score INTEGER NOT NULL DEFAULT 0,
    owner_id UUID REFERENCES users(id),
    assignee_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id)
);

-- Create indexes for tasks
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_required_skills_gin ON tasks USING gin(required_skills);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status VARCHAR NOT NULL DEFAULT 'pending',
    deliverables TEXT,
    success_criteria TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    task_id UUID REFERENCES tasks(id)
);

-- Create indexes for milestones
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_task_id ON milestones(task_id);
CREATE INDEX idx_milestones_is_completed ON milestones(is_completed);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content TEXT NOT NULL,
    task_id UUID NOT NULL REFERENCES tasks(id),
    author_id UUID NOT NULL REFERENCES users(id)
);

-- Create indexes for comments
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content TEXT NOT NULL,
    message_type messagetype NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    task_id UUID REFERENCES tasks(id),
    is_read BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for chat messages
CREATE INDEX idx_chat_messages_message_type ON chat_messages(message_type);
CREATE INDEX idx_chat_messages_task_id ON chat_messages(task_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient_id ON chat_messages(recipient_id);

-- Task files table
CREATE TABLE IF NOT EXISTS task_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filename VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR,
    task_id UUID NOT NULL REFERENCES tasks(id),
    uploaded_by_id UUID NOT NULL REFERENCES users(id)
);

-- User task associations table
CREATE TABLE IF NOT EXISTS user_task_associations (
    user_id UUID NOT NULL REFERENCES users(id),
    task_id UUID NOT NULL REFERENCES tasks(id),
    role VARCHAR NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, task_id)
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_files_updated_at BEFORE UPDATE ON task_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_associations ENABLE ROW LEVEL SECURITY;

-- Create a sample admin user (change password in production!)
INSERT INTO users (
    email,
    password,
    first_name,
    last_name,
    is_active,
    is_verified,
    impact_score,
    skills
) VALUES (
    'admin@example.com',
    '$2b$12$LQKxMtswQVZeD7gXj3LQQuRLqFyA3DW1Hs0U7W9g7KlvyXNx6Yl2y', -- password: admin123
    'Admin',
    'User',
    true,
    true,
    100,
    '["Leadership", "Project Management", "System Administration"]'::jsonb
) ON CONFLICT (email) DO NOTHING;