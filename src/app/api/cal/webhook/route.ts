import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { SB_TENANT_ID } from "@/lib/tenant";

// Cal.com webhook → mirror bookings into core.leads + core.appointments.
type CalPayload = {
  triggerEvent?: string;
  payload?: {
    uid?: string;
    bookingId?: number;
    startTime?: string;
    endTime?: string;
    attendees?: Array<{ name?: string; email?: string; language?: { locale?: string } }>;
  };
};

export async function POST(req: Request) {
  const raw = await req.text();

  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-cal-signature-256") ?? "";
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  let body: CalPayload;
  try {
    body = JSON.parse(raw) as CalPayload;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const trigger = body.triggerEvent;
  const p = body.payload ?? {};
  const attendee = p.attendees?.[0];
  const email = attendee?.email;
  const uid = p.uid ?? (p.bookingId != null ? String(p.bookingId) : undefined);
  const status = trigger === "BOOKING_CANCELLED" ? "cancelled" : "scheduled";

  if (!email || !uid) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("upsert_booking", {
      p_tenant: SB_TENANT_ID,
      p_email: email,
      p_full_name: attendee?.name ?? "",
      p_booking_uid: uid,
      p_starts_at: p.startTime ?? null,
      p_ends_at: p.endTime ?? null,
      p_status: status,
      p_locale: attendee?.language?.locale ?? "en",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown_error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
