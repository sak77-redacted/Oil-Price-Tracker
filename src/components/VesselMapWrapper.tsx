"use client";

import dynamic from "next/dynamic";

const VesselMap = dynamic(() => import("./VesselMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: 400,
        borderRadius: 12,
        border: "1px solid var(--card-border)",
        background: "var(--card)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        fontSize: 14,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ margin: "0 auto 8px", opacity: 0.5 }}
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <div>Loading vessel map...</div>
      </div>
    </div>
  ),
});

interface VesselMapWrapperProps {
  crisisCount?: number;
  normalCount?: number;
}

export default function VesselMapWrapper({ crisisCount, normalCount }: VesselMapWrapperProps) {
  return <VesselMap crisisCount={crisisCount} normalCount={normalCount} />;
}
