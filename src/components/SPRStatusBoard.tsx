"use client";

import type { SPRStatusData, SPRCountryStatus } from "@/lib/types";

interface SPRStatusBoardProps {
  data: SPRStatusData;
}

const flagEmojis: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}",
  JP: "\u{1F1EF}\u{1F1F5}",
  KR: "\u{1F1F0}\u{1F1F7}",
  CN: "\u{1F1E8}\u{1F1F3}",
  IN: "\u{1F1EE}\u{1F1F3}",
};

function CountryCard({ country }: { country: SPRCountryStatus }) {
  const isChina = country.flag === "CN";
  const isReleased = country.released;
  const flag = flagEmojis[country.flag] || country.flag;

  return (
    <div
      className={`relative flex flex-col items-center rounded-lg border p-4 text-center transition-colors ${
        isChina
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-[var(--card-border)] bg-[var(--background)]"
      }`}
    >
      {/* Flag + Country Name */}
      <span className="text-3xl">{flag}</span>
      <span className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">
        {country.country}
      </span>

      {/* Status Badge */}
      <span
        className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          isReleased
            ? "bg-red-500/15 text-red-400"
            : "bg-emerald-500/15 text-emerald-400"
        }`}
      >
        {isReleased ? "RELEASED" : "HOLDING"}
      </span>

      {/* Released Amount */}
      <span
        className={`mt-3 text-2xl font-bold tabular-nums ${
          isReleased ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {country.releasedMb}M
        <span className="ml-0.5 text-sm font-normal text-[var(--text-secondary)]">
          bbl
        </span>
      </span>

      {/* Total */}
      <span className="text-xs text-[var(--text-secondary)]">
        of {country.totalMb}M bbl
      </span>

      {/* Reserve Days */}
      <span className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
        {country.reserveDays} days reserve
      </span>

      {/* Notes */}
      {country.notes && (
        <p className="mt-2 text-[11px] leading-tight text-[var(--text-secondary)]">
          {country.notes}
        </p>
      )}

      {/* China highlight ring */}
      {isChina && (
        <div className="absolute -inset-px rounded-lg border-2 border-emerald-500/30 pointer-events-none" />
      )}
    </div>
  );
}

export default function SPRStatusBoard({ data }: SPRStatusBoardProps) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Strategic Reserve Status
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Who&apos;s released, who&apos;s holding back
        </p>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
        {/* Country Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {data.countries.map((country) => (
            <CountryCard key={country.flag} country={country} />
          ))}
        </div>

        {/* China Signal Callout */}
        <div className="mt-5 rounded-lg border-l-4 border-l-red-500 bg-red-500/5 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-lg" aria-hidden="true">
              {"\u26A0\uFE0F"}
            </span>
            <p className="text-sm font-medium leading-relaxed text-red-400">
              {data.chinaSignal}
            </p>
          </div>
        </div>

        {/* Last Updated */}
        <p className="mt-3 text-right text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
          Updated {data.lastUpdated}
        </p>
      </div>
    </section>
  );
}
