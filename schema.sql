-- AI English Learning Assistant: Database Schema (Supabase/PostgreSQL)

-- Table 1: Study Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    total_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
);

-- Table 2: Chat Transcript & Logs
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' or 'ai'
    content TEXT NOT NULL, -- content in English
    translation TEXT, -- content in Chinese
    audio_url TEXT,
    accuracy_score FLOAT, -- derived from pronunciation assessment
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: Word Bank (Mastery & Spaced Repetition)
CREATE TABLE IF NOT EXISTS public.word_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    word TEXT NOT NULL,
    error_type TEXT, -- e.g., 'Mispronunciation', 'Omission', 'Insertion'
    mastery_level INTEGER DEFAULT 1, -- SM-2 Repetitions
    ease FLOAT DEFAULT 2.5, -- SM-2 E-Factor
    interval INTEGER DEFAULT 0, -- Days to next review
    repetitions INTEGER DEFAULT 0,
    next_review TIMESTAMPTZ DEFAULT now(),
    translation TEXT,
    example_sentence TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, word) -- Constraint for upsert logic
);

-- Migration: run in Supabase SQL Editor
ALTER TABLE public.word_bank ADD COLUMN IF NOT EXISTS translation TEXT;
ALTER TABLE public.word_bank ADD COLUMN IF NOT EXISTS example_sentence TEXT;

-- Table 4: User Profiles (Gamification & Social)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Maps to user_id (Supabase Auth UID)
    name TEXT,
    avatar_url TEXT,
    total_score INTEGER DEFAULT 0,
    learning_streak INTEGER DEFAULT 0,
    last_practice_date DATE,
    mastered_words INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
