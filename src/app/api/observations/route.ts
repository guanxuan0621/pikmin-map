import { NextResponse } from "next/server";

import { enqueueLocationRefresh, processRefreshQueue } from "@/lib/mushrooms/jobs";
import { checkObservationRateLimit } from "@/lib/mushrooms/rate-limit";
import { submitObservation } from "@/lib/mushrooms/repository";
import { observationSchema } from "@/lib/mushrooms/validation";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = observationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Observation validation failed.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const rateLimit = checkObservationRateLimit(parsed.data.observerKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Observation submission rate limited.",
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429 },
    );
  }

  const result = await submitObservation(parsed.data);
  await enqueueLocationRefresh(result.location.id);

  if (!process.env.DATABASE_URL) {
    await processRefreshQueue(1);
  }

  return NextResponse.json(
    {
      accepted: true,
      observation: result.observation,
      location: result.location,
    },
    { status: 201 },
  );
}
