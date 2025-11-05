import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { DeliveryRepository } from "@features/delivery/services/delivery.repository";
import { DeliveryService } from "@features/delivery/services/delivery.service";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || "").trim();
  const recipientEmail = String(body?.recipientEmail || "").trim();
  const message = String(body?.message || "").trim();
  const expiresAtRaw = String(body?.expiresAt || "");
  const maxViews = Number(body?.maxViews || 10);
  const maxDownloads = Number(body?.maxDownloads || 5);

  if (!title || !recipientEmail || !expiresAtRaw) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  // Obtener organización del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json(
      { message: "User without organization" },
      { status: 400 }
    );
  }

  const service = new DeliveryService(new DeliveryRepository(supabase));
  const delivery = await service.sendDelivery({
    senderId: user.id,
    organizationId: profile.organization_id,
    title,
    message: message || undefined,
    recipientEmail,
    expiresAt: new Date(expiresAtRaw),
    maxViews,
    maxDownloads,
  });
  return NextResponse.json(delivery, { status: 201 });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const senderId = searchParams.get("senderId") || undefined;
    const organizationId = searchParams.get("organizationId") || undefined;

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { message: "User without organization" },
        { status: 400 }
      );
    }

    const repository = new DeliveryRepository(supabase);

    // Build filters based on query params, defaulting to user's organization
    const filters: any = {
      organizationId: organizationId || profile.organization_id,
    };

    if (status) {
      filters.status = status as "active" | "expired" | "revoked";
    }

    if (senderId) {
      filters.senderId = senderId;
    }

    // Use repository's findMany for flexible querying
    const deliveries = await repository.findMany(filters);

    return NextResponse.json(deliveries, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/deliveries] error:", error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
