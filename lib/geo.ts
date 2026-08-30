export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const KM_PER_DEGREE_LAT = 110.574;
const KM_PER_DEGREE_LNG_AT_EQUATOR = 111.32;
const DEGREES_TO_RADIANS = Math.PI / 180;
const CHAR_CODE_A = "A".charCodeAt(0);

function kmPerDegreeLng(atLat: number): number {
  return KM_PER_DEGREE_LNG_AT_EQUATOR * Math.cos(atLat * DEGREES_TO_RADIANS);
}

export function squareBounds(
  centerLat: number,
  centerLng: number,
  sizeKm: number,
): Bounds {
  const halfKm = sizeKm / 2;
  const latDelta = halfKm / KM_PER_DEGREE_LAT;
  const lngDelta = halfKm / kmPerDegreeLng(centerLat);

  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLng + lngDelta,
    west: centerLng - lngDelta,
  };
}

export interface GridCell {
  bounds: Bounds;
  label: string;
}

function stepSizes(bounds: Bounds, cellKm: number) {
  return {
    latStep: cellKm / KM_PER_DEGREE_LAT,
    lngStep: cellKm / kmPerDegreeLng((bounds.north + bounds.south) / 2),
  };
}

export function gridDimensions(
  bounds: Bounds,
  cellKm = 1,
): { rows: number; cols: number } {
  const { latStep, lngStep } = stepSizes(bounds, cellKm);
  return {
    rows: Math.round((bounds.north - bounds.south) / latStep),
    cols: Math.round((bounds.east - bounds.west) / lngStep),
  };
}

export function gridCells(bounds: Bounds, cellKm = 1): GridCell[] {
  const { latStep, lngStep } = stepSizes(bounds, cellKm);
  const { rows, cols } = gridDimensions(bounds, cellKm);

  const cells: GridCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const south = bounds.south + row * latStep;
      const west = bounds.west + col * lngStep;
      cells.push({
        bounds: { south, north: south + latStep, west, east: west + lngStep },
        label: `${String.fromCharCode(CHAR_CODE_A + rows - 1 - row)}${col + 1}`,
      });
    }
  }
  return cells;
}
