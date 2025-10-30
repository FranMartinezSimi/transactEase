import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DeliveryRepository } from "@/api/delivery/delivery.repository";
import { DeliveryService } from "@/api/delivery/delivery.service";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || "").trim();
  const recipientEmail = String(body?.recipientEmail || "").trim();
  const message = String(body?.message || "").trim();
  const expiresAtRaw = String(body?.expiresAt || "");
  const maxViews = Number(body?.maxViews || 10);
  const maxDownloads = Number(body?.maxDownloads || 5);

  if (!title || !recipientEmail || !expiresAtRaw) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  // Obtener organización del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ message: "User without organization" }, { status: 400 });
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


