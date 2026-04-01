"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ------------------------------------------------------------------ */
/*  Vessel data                                                        */
/* ------------------------------------------------------------------ */

interface Vessel {
  name: string;
  type: "VLCC" | "Suezmax" | "Aframax";
  flag: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number; // knots, 0 = anchored
  status: "transiting" | "anchored" | "waiting";
}

// Crisis vessels: 8 active — sparse traffic through the strait
// The actual shipping lanes run through the narrow water channel between
// Iran (north) and Oman's Musandam Peninsula (south), roughly lat 26.0-26.4
// at the narrowest point (lng ~56.3-56.5). Vessels east of the strait
// are in the Gulf of Oman (lat ~25.3-25.8, lng ~56.8-57.5).
const crisisVessels: Vessel[] = [
  // Transiting through the strait water channel (slow, cautious)
  {
    name: "Front Courage",
    type: "VLCC",
    flag: "Marshall Islands",
    lat: 26.22,
    lng: 56.42,
    heading: 135,
    speed: 8,
    status: "transiting",
  },
  {
    name: "Maran Apollo",
    type: "Suezmax",
    flag: "Greece",
    lat: 25.85,
    lng: 56.92,
    heading: 310,
    speed: 7,
    status: "transiting",
  },
  {
    name: "Nissos Kythnos",
    type: "Aframax",
    flag: "Greece",
    lat: 26.10,
    lng: 56.58,
    heading: 125,
    speed: 6,
    status: "transiting",
  },
  {
    name: "Eagle Varna",
    type: "Suezmax",
    flag: "Singapore",
    lat: 25.62,
    lng: 57.20,
    heading: 290,
    speed: 9,
    status: "transiting",
  },
  // Anchored / waiting near Fujairah (Gulf of Oman coast, UAE)
  {
    name: "Crude Sky",
    type: "VLCC",
    flag: "Liberia",
    lat: 25.18,
    lng: 56.38,
    heading: 0,
    speed: 0,
    status: "anchored",
  },
  {
    name: "Gener8 Miltiades",
    type: "VLCC",
    flag: "Marshall Islands",
    lat: 25.25,
    lng: 56.45,
    heading: 0,
    speed: 0,
    status: "waiting",
  },
  {
    name: "Suez Rajan",
    type: "Suezmax",
    flag: "Panama",
    lat: 25.10,
    lng: 56.50,
    heading: 0,
    speed: 0,
    status: "anchored",
  },
  // Near Bandar Abbas port (on the water, south of the city)
  {
    name: "Aframax Star",
    type: "Aframax",
    flag: "Iran",
    lat: 27.08,
    lng: 56.45,
    heading: 180,
    speed: 0,
    status: "anchored",
  },
];

// Ghost fleet: normal traffic positions (~20 vessels along shipping lanes)
// Outbound lane (exiting Gulf → Gulf of Oman): runs through the strait at lat ~26.25-26.35
// then curves southeast into the Gulf of Oman at lat ~25.5-26.0, lng ~57.0-58.0
// Inbound lane (entering Gulf): runs slightly south of outbound, lat ~26.05-26.20
const ghostVessels: Vessel[] = [
  // Outbound lane — inside Persian Gulf approach (wider water, west of strait)
  { name: "Ghost-01", type: "VLCC", flag: "-", lat: 26.50, lng: 55.20, heading: 120, speed: 12, status: "transiting" },
  { name: "Ghost-02", type: "Suezmax", flag: "-", lat: 26.48, lng: 55.50, heading: 125, speed: 11, status: "transiting" },
  { name: "Ghost-03", type: "VLCC", flag: "-", lat: 26.42, lng: 55.80, heading: 130, speed: 13, status: "transiting" },
  // Outbound lane — through the strait channel
  { name: "Ghost-04", type: "Aframax", flag: "-", lat: 26.32, lng: 56.15, heading: 130, speed: 10, status: "transiting" },
  { name: "Ghost-05", type: "Suezmax", flag: "-", lat: 26.25, lng: 56.38, heading: 135, speed: 12, status: "transiting" },
  { name: "Ghost-06", type: "VLCC", flag: "-", lat: 26.18, lng: 56.55, heading: 140, speed: 11, status: "transiting" },
  // Outbound lane — exiting into Gulf of Oman
  { name: "Ghost-07", type: "Aframax", flag: "-", lat: 26.02, lng: 56.80, heading: 145, speed: 13, status: "transiting" },
  { name: "Ghost-08", type: "VLCC", flag: "-", lat: 25.82, lng: 57.10, heading: 150, speed: 12, status: "transiting" },
  { name: "Ghost-09", type: "Suezmax", flag: "-", lat: 25.60, lng: 57.40, heading: 155, speed: 11, status: "transiting" },
  { name: "Ghost-10", type: "VLCC", flag: "-", lat: 25.40, lng: 57.70, heading: 160, speed: 12, status: "transiting" },
  // Inbound lane — from Gulf of Oman approach (south of outbound)
  { name: "Ghost-11", type: "VLCC", flag: "-", lat: 25.30, lng: 57.80, heading: 310, speed: 12, status: "transiting" },
  { name: "Ghost-12", type: "Suezmax", flag: "-", lat: 25.50, lng: 57.50, heading: 315, speed: 11, status: "transiting" },
  { name: "Ghost-13", type: "Aframax", flag: "-", lat: 25.72, lng: 57.18, heading: 320, speed: 13, status: "transiting" },
  { name: "Ghost-14", type: "VLCC", flag: "-", lat: 25.90, lng: 56.90, heading: 320, speed: 12, status: "transiting" },
  // Inbound lane — through the strait channel (slightly south of outbound)
  { name: "Ghost-15", type: "Suezmax", flag: "-", lat: 26.05, lng: 56.62, heading: 310, speed: 11, status: "transiting" },
  { name: "Ghost-16", type: "VLCC", flag: "-", lat: 26.12, lng: 56.42, heading: 305, speed: 10, status: "transiting" },
  { name: "Ghost-17", type: "Aframax", flag: "-", lat: 26.20, lng: 56.20, heading: 300, speed: 12, status: "transiting" },
  // Inbound lane — entering Persian Gulf (wider water)
  { name: "Ghost-18", type: "VLCC", flag: "-", lat: 26.30, lng: 55.90, heading: 295, speed: 13, status: "transiting" },
  { name: "Ghost-19", type: "Suezmax", flag: "-", lat: 26.38, lng: 55.60, heading: 290, speed: 11, status: "transiting" },
  { name: "Ghost-20", type: "VLCC", flag: "-", lat: 26.45, lng: 55.30, heading: 285, speed: 12, status: "transiting" },
];

/* ------------------------------------------------------------------ */
/*  Custom Leaflet icons                                               */
/* ------------------------------------------------------------------ */

function createVesselIcon(color: string, opacity: number = 1): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
    html: `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="5" fill="${color}" fill-opacity="${opacity}" stroke="${color}" stroke-opacity="${Math.min(opacity + 0.15, 1)}" stroke-width="1.5"/>
      ${opacity >= 0.8 ? `<circle cx="7" cy="7" r="8" fill="none" stroke="${color}" stroke-opacity="0.3" stroke-width="1">
        <animate attributeName="r" from="6" to="12" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>` : ""}
    </svg>`,
  });
}

const crisisIcon = createVesselIcon("#f97316", 1); // orange
const anchoredIcon = createVesselIcon("#ef4444", 1); // red
const ghostIcon = createVesselIcon("#71717a", 0.25); // grey, faded

/* ------------------------------------------------------------------ */
/*  Geographic labels overlay                                          */
/* ------------------------------------------------------------------ */

function GeoLabels() {
  const map = useMap();

  useEffect(() => {
    const labels: { text: string; lat: number; lng: number; size: number }[] = [
      { text: "IRAN", lat: 27.35, lng: 55.50, size: 13 },
      { text: "OMAN", lat: 25.30, lng: 57.50, size: 13 },
      { text: "UAE", lat: 25.55, lng: 55.60, size: 13 },
      { text: "Strait of Hormuz", lat: 26.30, lng: 56.80, size: 11 },
      { text: "BANDAR ABBAS", lat: 27.22, lng: 56.30, size: 9 },
      { text: "RAS AL KHAIMAH", lat: 25.82, lng: 55.95, size: 9 },
    ];

    const markers = labels.map((label) => {
      const icon = L.divIcon({
        className: "",
        iconSize: [0, 0],
        html: `<div style="
          color: rgba(228,228,231,0.35);
          font-size: ${label.size}px;
          font-weight: 600;
          letter-spacing: ${label.size > 12 ? "3px" : "1.5px"};
          text-transform: uppercase;
          white-space: nowrap;
          pointer-events: none;
          text-shadow: 0 0 8px rgba(0,0,0,0.8);
          transform: translate(-50%, -50%);
          ${label.text === "Strait of Hormuz" ? "font-style: italic; letter-spacing: 2px;" : ""}
        ">${label.text}</div>`,
      });
      return L.marker([label.lat, label.lng], { icon, interactive: false }).addTo(map);
    });

    return () => {
      markers.forEach((m) => map.removeLayer(m));
    };
  }, [map]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Stats overlay                                                      */
/* ------------------------------------------------------------------ */

function StatsOverlay({ crisisCount, normalCount }: { crisisCount: number; normalCount: number }) {
  const drop = Math.round(((normalCount - crisisCount) / normalCount) * 100);

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        background: "rgba(18, 18, 26, 0.92)",
        border: "1px solid var(--card-border)",
        borderRadius: 10,
        padding: "12px 16px",
        minWidth: 170,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Vessel Traffic
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: "#f97316" }}>{crisisCount}</span>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>today</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-secondary)" }}>~{normalCount}</span>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>normal</span>
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#ef4444",
          background: "rgba(239, 68, 68, 0.1)",
          borderRadius: 6,
          padding: "4px 8px",
          textAlign: "center",
        }}
      >
        {drop}% collapse
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend overlay                                                      */
/* ------------------------------------------------------------------ */

function LegendOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: 12,
        zIndex: 1000,
        background: "rgba(18, 18, 26, 0.92)",
        border: "1px solid var(--card-border)",
        borderRadius: 8,
        padding: "10px 14px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#f97316" /></svg>
        <span style={{ fontSize: 12, color: "var(--text-primary)" }}>Active vessels (crisis)</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#ef4444" /></svg>
        <span style={{ fontSize: 12, color: "var(--text-primary)" }}>Anchored / waiting</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#71717a" fillOpacity={0.35} /></svg>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Normal traffic volume (ghost)</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main VesselMap component                                           */
/* ------------------------------------------------------------------ */

interface VesselMapProps {
  crisisCount?: number;
  normalCount?: number;
}

export default function VesselMap({ crisisCount = 8, normalCount = 100 }: VesselMapProps) {
  return (
    <div
      className="vessel-map-wrapper"
      style={{
        position: "relative",
        width: "100%",
        height: 400,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--card-border)",
        background: "var(--card)",
      }}
    >
      <MapContainer
        center={[26.55, 56.25]}
        zoom={8}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <GeoLabels />

        {/* Ghost fleet — normal traffic volume */}
        {ghostVessels.map((v, i) => (
          <Marker key={`ghost-${i}`} position={[v.lat, v.lng]} icon={ghostIcon}>
            <Tooltip
              direction="top"
              offset={[0, -8]}
              className="vessel-tooltip-ghost"
            >
              <span style={{ color: "#71717a", fontSize: 11 }}>Normal traffic lane</span>
            </Tooltip>
          </Marker>
        ))}

        {/* Crisis vessels — active */}
        {crisisVessels.map((v, i) => {
          const icon = v.speed > 0 ? crisisIcon : anchoredIcon;
          return (
            <Marker key={`crisis-${i}`} position={[v.lat, v.lng]} icon={icon}>
              <Popup>
                <div style={{
                  background: "#12121a",
                  color: "#e4e4e7",
                  padding: "8px 4px",
                  minWidth: 180,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{v.name}</div>
                  <div style={{ color: "#a1a1aa" }}>
                    <span style={{ fontWeight: 600 }}>Type:</span> {v.type}
                  </div>
                  <div style={{ color: "#a1a1aa" }}>
                    <span style={{ fontWeight: 600 }}>Flag:</span> {v.flag}
                  </div>
                  <div style={{ color: "#a1a1aa" }}>
                    <span style={{ fontWeight: 600 }}>Speed:</span> {v.speed > 0 ? `${v.speed} kn` : "Stationary"}
                  </div>
                  <div style={{ color: "#a1a1aa" }}>
                    <span style={{ fontWeight: 600 }}>Heading:</span> {v.heading > 0 ? `${v.heading}°` : "N/A"}
                  </div>
                  <div style={{
                    marginTop: 6,
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "inline-block",
                    background:
                      v.status === "transiting"
                        ? "rgba(249,115,22,0.15)"
                        : v.status === "anchored"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(234,179,8,0.15)",
                    color:
                      v.status === "transiting"
                        ? "#f97316"
                        : v.status === "anchored"
                          ? "#ef4444"
                          : "#eab308",
                  }}>
                    {v.status}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <StatsOverlay crisisCount={crisisCount} normalCount={normalCount} />
      <LegendOverlay />
    </div>
  );
}
