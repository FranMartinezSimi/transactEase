-- Migration: OAuth Setup with Flexible Auth Model
-- Description: Adds invitations table, updates roles, creates auto-profile trigger
-- Date: 2025-01-25

-- =====================================================
-- 1. CREATE INVITATIONS TABLE
-- =====================================================
-- For inviting users to organizations
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  invited_by uuid NOT NULL REFERENCES public.profiles(id),
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata jsonb
);

-- Index for faster lookups
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX idx_invitations_status ON public.invitations(status);

-- =====================================================
-- 2. UPDATE PROFILES TABLE
-- =====================================================
-- Add 'owner' role if not exists (profiles may already have role field)
-- We need to check and update the constraint

-- Drop existing role constraint if exists
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with 'owner' role
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'member'));

-- Ensure organization_id can be NULL for temporary users
ALTER TABLE public.profiles
  ALTER COLUMN organization_id DROP NOT NULL;

-- =====================================================
-- 3. CREATE FUNCTION: Auto-create profile on OAuth signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if user doesn't already have one
  -- This handles OAuth signups
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at,
    is_temporary
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'member', -- Default role, will be updated if invited
    true,
    true, -- OAuth users are email verified by provider
    NOW(),
    NOW(),
    false -- OAuth users are not temporary
  )
  ON CONFLICT (id) DO NOTHING; -- Don't overwrite if profile exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREATE TRIGGER: Auto-create profile on auth signup
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. RLS POLICIES FOR INVITATIONS
-- =====================================================
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations sent to their email
CREATE POLICY "Users can view own invitations"
  ON public.invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Admins and owners can view org invitations
CREATE POLICY "Admins can view org invitations"
  ON public.invitations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_temporary = false
    )
  );

-- Admins and owners can create invitations
CREATE POLICY "Admins can create invitations"
  ON public.invitations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_temporary = false
    )
  );

-- Admins and owners can update org invitations (cancel, etc)
CREATE POLICY "Admins can update invitations"
  ON public.invitations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_temporary = false
    )
  );

-- =====================================================
-- 6. UPDATE PROFILES RLS POLICIES
-- =====================================================
-- Drop existing policies to recreate with temp user support
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with better logic for temporary vs permanent users
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    -- Admins can view org users
    (
      organization_id IN (
        SELECT organization_id
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('owner', 'admin')
          AND is_temporary = false
      )
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only allow profile creation via trigger or admin actions
CREATE POLICY "System can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    -- OAuth users are created by trigger
    auth.uid() = id OR
    -- Admins can create temporary users
    (
      is_temporary = true AND
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('owner', 'admin')
          AND is_temporary = false
      )
    )
  );

-- =====================================================
-- 7. HELPER FUNCTION: Accept invitation
-- =====================================================
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token text
)
RETURNS jsonb AS $$
DECLARE
  invitation_record public.invitations;
  user_profile public.profiles;
BEGIN
  -- Get invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Get user profile
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF user_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Check email matches
  IF user_profile.email != invitation_record.email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email mismatch');
  END IF;

  -- Update user profile with organization
  UPDATE public.profiles
  SET
    organization_id = invitation_record.organization_id,
    role = invitation_record.role,
    updated_at = NOW()
  WHERE id = auth.uid();

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. COMMENTS
-- =====================================================
COMMENT ON TABLE public.invitations IS 'User invitations to join organizations';
COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates profile when OAuth user signs up';
COMMENT ON FUNCTION public.accept_invitation(text) IS 'Accepts an invitation and adds user to organization';
