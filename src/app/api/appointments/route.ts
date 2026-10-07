import { NextResponse } from "next/server";
import { createBooking } from "@/features/booking/create-booking";
import { parseCreateBookingInput } from "@/features/booking/validation";
import { prismaBookingRepository } from "@/lib/prisma-booking-repository";
import { logServerError } from "@/server/observability";
import { enforceRateLimit } from "@/server/rate-limit";

// Public POST is the customer-facing booking flow; administrative appointment
// reads/changes must use authenticated, business-scoped routes.
export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimit(request, "BOOKING_RATE_LIMITER", "appointment");
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = parseCreateBookingInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const result = await createBooking(parsed.value, { repository: prismaBookingRepository });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, appointment: result.appointment });
  } catch (error) {
    logServerError(request, "appointments.create.failed", error);
    return NextResponse.json({ error: "Error al registrar la cita" }, { status: 500 });
  }
}
