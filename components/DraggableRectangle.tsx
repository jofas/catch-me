"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { Bounds } from "../lib/geo";

type DraggableRectangleProps = {
  bounds: Bounds;
  onCenterChange: (center: { lat: number; lng: number }) => void;
};

const EPSILON = 1e-9;

function boundsEqual(a: google.maps.LatLngBounds, b: Bounds): boolean {
  return (
    Math.abs(a.getNorthEast().lat() - b.north) < EPSILON &&
    Math.abs(a.getSouthWest().lat() - b.south) < EPSILON &&
    Math.abs(a.getNorthEast().lng() - b.east) < EPSILON &&
    Math.abs(a.getSouthWest().lng() - b.west) < EPSILON
  );
}

export default function DraggableRectangle({
  bounds,
  onCenterChange,
}: DraggableRectangleProps) {
  const map = useMap();
  const rectangleRef = useRef<google.maps.Rectangle | null>(null);

  useEffect(() => {
    if (!map) return;

    const rectangle = new google.maps.Rectangle({
      map,
      bounds,
      draggable: true,
      strokeColor: "#2563eb",
      fillColor: "#2563eb",
      fillOpacity: 0.15,
    });
    rectangleRef.current = rectangle;

    const listener = rectangle.addListener("bounds_changed", () => {
      const newBounds = rectangle.getBounds();
      if (!newBounds) return;
      const center = newBounds.getCenter();
      onCenterChange({ lat: center.lat(), lng: center.lng() });
    });

    return () => {
      listener.remove();
      rectangle.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    const rectangle = rectangleRef.current;
    if (!rectangle) return;

    const current = rectangle.getBounds();
    if (current && boundsEqual(current, bounds)) return;

    rectangle.setBounds(bounds);
  }, [bounds]);

  return null;
}
