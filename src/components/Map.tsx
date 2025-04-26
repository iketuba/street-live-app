"use client";
import { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "mapbox-gl/dist/mapbox-gl.css";

export default function SimpleMap() {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY ?? "";
  const mapContainer = useRef<HTMLDivElement | null>(null); // Specify the type of the ref
  const [map, setMap] = useState<mapboxgl.Map | null>(null); // Specify the type of the map state

  useEffect(() => {
    const initializeMap = ({
      setMap,
      mapContainer,
    }: {
      setMap: React.Dispatch<React.SetStateAction<mapboxgl.Map | null>>;
      mapContainer: React.MutableRefObject<HTMLDivElement | null>;
    }) => {
      if (!mapContainer.current) return; // Ensure the container exists

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        center: [139.7670516, 35.6811673], // Tokyo Station as the initial center
        zoom: 15,
        style: "mapbox://styles/mapbox/streets-v12",
      });

      const language = new MapboxLanguage({ defaultLanguage: "ja" });
      map.addControl(language);

      map.on("load", () => {
        setMap(map);
        map.resize();
      });
    };

    if (!map) initializeMap({ setMap, mapContainer });
  }, [map]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
}
