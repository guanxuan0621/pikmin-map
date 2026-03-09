export type MapViewport = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type DerivedStateRecord = {
  currentStatus: "ACTIVE" | "DEFEATED" | "UNKNOWN";
  confidence: number;
  sourceObservationCount: number;
  lastObservedAt: string;
  staleAt?: string;
};

export type PredictionRecord = {
  status: "AVAILABLE" | "UNAVAILABLE";
  predictedCompletionTime?: string;
  predictedNextSpawnTime?: string;
  confidence: number;
  provenance: string;
  lastComputedAt: string;
};

export type MushroomLocationSourceLayer = "confirmed" | "candidate";

export type MushroomLocationRecord = {
  id: string;
  externalKey: string;
  title?: string;
  latitude: number;
  longitude: number;
  derivedState?: DerivedStateRecord;
  prediction?: PredictionRecord;
  sourceLayer?: MushroomLocationSourceLayer;
};

export type ObservationRecord = {
  id: string;
  locationId: string;
  observerKey: string;
  observedAt: string;
  isAvailable: boolean;
  mushroomType?: string;
  defeatedAt?: string;
  trustStatus: "ACCEPTED" | "FLAGGED";
  trustFlags: string[];
  derivedConflictsWithCurrentState: boolean;
};

export type SubmitObservationInput = {
  observerKey: string;
  observedAt: string;
  isAvailable: boolean;
  mushroomType?: string;
  defeatedAt?: string;
  location: {
    title?: string;
    latitude: number;
    longitude: number;
  };
};
