import { NextResponse } from "next/server";

import { getMushroomsInViewport } from "@/lib/mushrooms/repository";
import { parseViewport } from "@/lib/mushrooms/geo";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const viewport = parseViewport(searchParams);
    const centerLat = searchParams.get("centerLat");
    const centerLng = searchParams.get("centerLng");
    const radiusMeters = searchParams.get("radiusMeters");
    const nearby =
      centerLat && centerLng
        ? {
            latitude: Number(centerLat),
            longitude: Number(centerLng),
            radiusMeters: Number(radiusMeters ?? 1200),
          }
        : undefined;
    const mushrooms = await getMushroomsInViewport(viewport, nearby ? { nearby } : undefined);

    return NextResponse.json({
      viewport,
      nearby,
      mushrooms,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch mushrooms.",
      },
      { status: 400 },
    );
  }
}
