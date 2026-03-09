import { z } from "zod";

export const observationSchema = z.object({
  observerKey: z.string().trim().min(2).max(120),
  observedAt: z.iso.datetime(),
  isAvailable: z.boolean(),
  mushroomType: z.string().trim().min(1).max(80).optional(),
  defeatedAt: z.iso.datetime().optional(),
  location: z.object({
    title: z.string().trim().min(1).max(120).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

export function getObservationTrustFlags(input: z.infer<typeof observationSchema>): string[] {
  const flags: string[] = [];
  const observedAt = new Date(input.observedAt).getTime();

  if (observedAt > Date.now() + 1000 * 60 * 5) {
    flags.push("future-timestamp");
  }

  if (!input.isAvailable && !input.defeatedAt) {
    flags.push("missing-defeated-at");
  }

  return flags;
}

export type ValidObservationInput = z.infer<typeof observationSchema>;
