-- Migration: Organization Invitations
-- Description: Create table to store pending organization invitations
-- This allows admins to pre-assign users before they sign up via SSO

-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ,

  -- Ensure no duplicate pending invitations for same email in same org
  UNIQUE(organization_id, email)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_pending ON public.organization_invitations(is_accepted) WHERE is_accepted = false;

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view invitations for their organization
CREATE POLICY "Admins can view org invitations"
ON public.organization_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = organization_invitations.organization_id
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Policy: Admins can create invitations for their organization
CREATE POLICY "Admins can create org invitations"
ON public.organization_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = organization_invitations.organization_id
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Policy: Admins can delete invitations for their organization
CREATE POLICY "Admins can delete org invitations"
ON public.organization_invitations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = organization_invitations.organization_id
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Function to auto-assign invited users when they sign up
CREATE OR REPLACE FUNCTION public.handle_invited_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  invitation RECORD;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT *
  INTO invitation
  FROM public.organization_invitations
  WHERE email = NEW.email
  AND is_accepted = false
  ORDER BY invited_at DESC
  LIMIT 1;

  -- If invitation found, assign user to organization with pre-assigned role
  IF FOUND THEN
    -- Update the profile with organization and role from invitation
    UPDATE public.profiles
    SET
      organization_id = invitation.organization_id,
      role = invitation.role,
      is_active = true
    WHERE id = NEW.id;

    -- Mark invitation as accepted
    UPDATE public.organization_invitations
    SET
      is_accepted = true,
      accepted_at = now()
    WHERE id = invitation.id;

    RAISE NOTICE 'User % auto-assigned to organization % with role %',
      NEW.email, invitation.organization_id, invitation.role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign invited users on profile creation
DROP TRIGGER IF EXISTS on_invited_user_signup ON public.profiles;
CREATE TRIGGER on_invited_user_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invited_user_signup();

-- Add comment to table
COMMENT ON TABLE public.organization_invitations IS
  'Stores pending invitations for users to join organizations. When a user signs up via SSO, they are automatically assigned to the organization with the pre-assigned role.';
