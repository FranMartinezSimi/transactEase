import { NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { DeliveryRepository } from "@features/delivery/services/delivery.repository";
import { DeliveryService } from "@features/delivery/services/delivery.service";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const status = String(body?.status || "");
  if (!status || !["active", "expired", "revoked"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const service = new DeliveryService(new DeliveryRepository(supabase));
  const updated = await service.updateDeliveryStatus(
    id,
    status as "active" | "expired" | "revoked"
  );
  return NextResponse.json(updated, { status: 200 });
}
