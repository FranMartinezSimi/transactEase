import { createClient } from "@shared/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * OAuth Callback Route
 *
 * Handles the callback from OAuth providers (Google)
 * Exchanges the code for a session and redirects to appropriate page
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  console.log("[OAuth Callback] Processing callback", {
    hasCode: !!code,
    next,
    origin,
  });

  if (!code) {
    console.error("[OAuth Callback] No authorization code provided");
    return NextResponse.redirect(
      `${origin}/auth/login?error=missing_code&message=No authorization code provided`
    );
  }

  try {
    const supabase = await createClient();

    console.log(
      "[OAuth Callback] Supabase URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    console.log(
      "[OAuth Callback] Supabase Key exists:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[OAuth Callback] Error exchanging code:", error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`
      );
    }

    if (!data.session) {
      console.error("[OAuth Callback] No session returned");
      return NextResponse.redirect(
        `${origin}/auth/login?error=no_session&message=Authentication failed`
      );
    }

    const { user, session } = data;

    console.log("[OAuth Callback] Successfully authenticated", {
      userId: user.id,
      email: user.email,
    });

    // Check if user has a profile
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, organization_id, role, is_temporary, is_active")
      .eq("id", user.id)
      .single();

    // If no profile or no organization, check if email domain matches any organization
    if (!profile?.organization_id && user.email) {
      const emailDomain = user.email.split("@")[1];
      console.log("[OAuth Callback] No organization assigned, checking domain match for:", {
        email: user.email,
        domain: emailDomain,
      });

      // Find organization with matching domain
      const { data: organizations, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, domain")
        .eq("domain", emailDomain);

      if (!orgError && organizations && organizations.length > 0) {
        const org = organizations[0]; // Take first match
        console.log("[OAuth Callback] Found organization with matching domain:", {
          org_id: org.id,
          org_name: org.name,
          domain: org.domain,
        });

        // Assign user to organization with default "member" role
        // TODO: In future, check if admin pre-assigned a specific role for this email
        const assignedRole = "member";

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            organization_id: org.id,
            role: assignedRole,
            is_active: true,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("[OAuth Callback] Error assigning to organization:", updateError);
        } else {
          console.log("[OAuth Callback] Successfully auto-assigned user to organization based on domain match");

          // Fetch updated profile
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .select("id, organization_id, role, is_temporary, is_active")
            .eq("id", user.id)
            .single();

          profile = updatedProfile;
        }
      } else {
        console.log("[OAuth Callback] No organization found with matching domain:", emailDomain);
      }
    }

    if (profileError && !profile) {
      console.error("[OAuth Callback] Error fetching profile:", profileError);
      // Profile might not exist yet, trigger should create it
      // But we'll still redirect to dashboard - middleware will handle it
    }

    console.log("[OAuth Callback] User profile:", {
      hasProfile: !!profile,
      hasOrganization: !!profile?.organization_id,
      role: profile?.role,
      isActive: profile?.is_active,
    });

    // Determine redirect destination
    let redirectTo = next;

    if (profile) {
      if (!profile.organization_id) {
        // User doesn't have an organization yet
        // Redirect to create organization
        redirectTo = "/onboarding/create-organization";
        console.log("[OAuth Callback] Redirecting to create organization");
      } else {
        // User has organization, redirect to dashboard
        redirectTo = next;
        console.log("[OAuth Callback] Redirecting to dashboard");
      }
    } else {
      // Profile doesn't exist yet (trigger should create it)
      // Redirect to dashboard, middleware will handle onboarding
      redirectTo = next;
      console.log(
        "[OAuth Callback] Profile not found, redirecting to dashboard"
      );
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
  } catch (error) {
    console.error("[OAuth Callback] Unexpected error:", error);
    return NextResponse.redirect(
      `${origin}/auth/login?error=unexpected&message=An unexpected error occurred`
    );
  }
}
