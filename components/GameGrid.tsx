"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { gridCells, gridDimensions, type Bounds } from "../lib/geo";

type GameGridProps = {
  bounds: Bounds;
  cellKm?: number;
};

function shapeKey(bounds: Bounds, cellKm: number): string {
  const { rows, cols } = gridDimensions(bounds, cellKm);
  return `${rows}:${cols}:${cellKm}`;
}

function cellCenter(bounds: Bounds): google.maps.LatLngLiteral {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };
}

function buildLabelElement(text: string): HTMLDivElement {
  const div = document.createElement("div");
  div.textContent = text;
  Object.assign(div.style, {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "600",
  });
  return div;
}

export default function GameGrid({ bounds, cellKm = 1 }: GameGridProps) {
  const map = useMap();
  const markerLibrary = useMapsLibrary("marker");
  const rectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const labelsRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const labelPositionsRef = useRef<google.maps.LatLngLiteral[]>([]);
  const lastBoundsRef = useRef<Bounds | null>(null);
  const lastShapeKeyRef = useRef<string | null>(null);

  const clear = useCallback(() => {
    rectanglesRef.current.forEach((rectangle) => rectangle.setMap(null));
    labelsRef.current.forEach((marker) => (marker.map = null));
    rectanglesRef.current = [];
    labelsRef.current = [];
  }, []);

  const translate = useCallback((deltaLat: number, deltaLng: number) => {
    rectanglesRef.current.forEach((rectangle) => {
      const current = rectangle.getBounds();
      if (!current) return;
      rectangle.setBounds({
        north: current.getNorthEast().lat() + deltaLat,
        south: current.getSouthWest().lat() + deltaLat,
        east: current.getNorthEast().lng() + deltaLng,
        west: current.getSouthWest().lng() + deltaLng,
      });
    });

    labelPositionsRef.current = labelPositionsRef.current.map((pos, i) => {
      const next = { lat: pos.lat + deltaLat, lng: pos.lng + deltaLng };
      labelsRef.current[i].position = next;
      return next;
    });
  }, []);

  const rebuild = useCallback(() => {
    clear();

    const cells = gridCells(bounds, cellKm);

    rectanglesRef.current = cells.map(
      (cell) =>
        new google.maps.Rectangle({
          map,
          bounds: cell.bounds,
          clickable: false,
          strokeColor: "#2563eb",
          strokeOpacity: 0.4,
          strokeWeight: 1,
          fillOpacity: 0,
        }),
    );

    labelPositionsRef.current = cells.map((cell) => cellCenter(cell.bounds));
    labelsRef.current = cells.map(
      (cell) =>
        new google.maps.marker.AdvancedMarkerElement({
          map,
          position: cellCenter(cell.bounds),
          content: buildLabelElement(cell.label),
        }),
    );
  }, [map, bounds, cellKm, clear]);

  useEffect(() => {
    if (!map || !markerLibrary) return;

    const key = shapeKey(bounds, cellKm);
    const sameShape =
      rectanglesRef.current.length > 0 && lastShapeKeyRef.current === key;

    if (sameShape && lastBoundsRef.current) {
      translate(
        bounds.south - lastBoundsRef.current.south,
        bounds.west - lastBoundsRef.current.west,
      );
    } else {
      rebuild();
      lastShapeKeyRef.current = key;
    }

    lastBoundsRef.current = bounds;
  }, [map, markerLibrary, rebuild, translate, bounds, cellKm]);

  useEffect(() => clear, [map, clear]);

  return null;
}
