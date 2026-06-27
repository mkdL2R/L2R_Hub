
-- Extend roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'instructor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'administrator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mentor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wellness_practitioner';
