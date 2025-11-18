# Setup: Organization Invitations System

This document explains how to set up the organization invitations feature.

## What was implemented?

Now you can **add users to your organization WITHOUT them needing to exist first**. When you add a user:

1. **If the user already exists** → They are immediately added to your organization
2. **If the user doesn't exist** → An invitation is created and they are automatically added when they sign up via SSO

## Setup Instructions

### Step 1: Apply the Database Migration

Go to your Supabase Dashboard:
1. Navigate to https://supabase.com/dashboard/project/mmifzpfmlngtrjacviyy
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/008_organization_invitations.sql`
5. Click **Run**

This will create:
- ✅ `organization_invitations` table
- ✅ Policies for admin access
- ✅ Trigger to auto-assign users when they sign up

### Step 2: Test the Feature

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to Settings → Users:**
   - Click "Add Member"
   - Enter an email that doesn't exist yet (e.g., `newuser@yourdomain.com`)
   - Select a role (Admin or Member)
   - Click "Add Member"

3. **You should see:**
   - A success message: "Invitation sent to [email]"
   - The email appears in the "Pending Invitations" section
   - When that user signs up via Google SSO, they will automatically be added to your organization with the pre-assigned role

## How it works

### For existing users:
```
User clicks "Add Member"
→ API checks if user exists
→ User found!
→ Assign to organization immediately
```

### For new users:
```
User clicks "Add Member"
→ API checks if user exists
→ User NOT found
→ Create invitation record
→ Show in "Pending Invitations"

[Later...]
User signs up via SSO
→ Trigger checks for pending invitations
→ Invitation found!
→ Auto-assign to organization with pre-assigned role
```

## Files Modified

### Database:
- ✅ `supabase/migrations/008_organization_invitations.sql` - New table + trigger

### API Routes:
- ✅ `src/app/api/organization/members/route.ts` - Updated to create invitations
- ✅ `src/app/api/organization/invitations/route.ts` - Get pending invitations
- ✅ `src/app/api/organization/invitations/[invitationId]/route.ts` - Cancel invitations

### UI:
- ✅ `src/app/settings/users/page.tsx` - Shows pending invitations + cancel functionality

## Features

✅ **Simple workflow:** Just enter email + role, no complications
✅ **Auto-assignment:** Users are automatically added when they sign up
✅ **Pre-assign roles:** Set whether they'll be Admin or Member before they join
✅ **Pending invitations view:** See who has been invited but hasn't joined yet
✅ **Cancel invitations:** Remove pending invitations if needed
✅ **Domain validation:** Only emails matching your organization domain can be invited
✅ **Duplicate prevention:** Can't invite the same email twice

## Next Steps (Optional Enhancements)

- [ ] Send email notifications when users are invited
- [ ] Add expiration dates for invitations (auto-delete after 30 days)
- [ ] Resend invitation emails
- [ ] Invitation links with tokens (alternative to SSO)

---

**You're all set!** Just run the SQL migration in Supabase and the feature is ready to use.
