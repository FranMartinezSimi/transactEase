import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DeliveryRepository } from "@/api/delivery/delivery.repository";
import { DeliveryService } from "@/api/delivery/delivery.service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? undefined;
  const emailProvided = url.searchParams.get("email") ?? undefined;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const loggedUser = userData?.user ?? null;

  const repository = new DeliveryRepository(supabase);
  const service = new DeliveryService(repository);

  const hasAccess = await service.validateAccess(id, token, emailProvided);
  if (!hasAccess) {
    return NextResponse.json(
      { message: "Email verification required", code: "EMAIL_VERIFICATION_REQUIRED" },
      { status: 401 }
    );
  }

  const deliveryForViewer = await service.getDeliveryForViewer(id, loggedUser?.email || null);
  if (!deliveryForViewer) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json(deliveryForViewer, { status: 200 });
}


