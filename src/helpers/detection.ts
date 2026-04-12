import { REGION_BOUNDARIES } from "./region";

export const detectRegionFromCoords = (lat: number, lng: number) => {
  for (const [region, bounds] of Object.entries(REGION_BOUNDARIES)) {
    const b: any = bounds;
    if (
      lat >= b.latMin &&
      lat <= b.latMax &&
      lng >= b.lngMin &&
      lng <= b.lngMax
    ) {
      return region;
    }
  }
  return null;
};
