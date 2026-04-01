"use client";

import type { GlobalImpactData } from "@/lib/types";

interface GlobalImpactProps {
  data: GlobalImpactData;
}

function StatBox({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-[var(--background)] px-4 py-3">
      <span className="text-xl font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </span>
    </div>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
      <span
        className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: "var(--warning)" }}
      />
      <span>{text}</span>
    </li>
  );
}

export default function GlobalImpact({ data }: GlobalImpactProps) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Global Trade Impact
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Macro disruption stats and alternative routing costs from the Hormuz
          crisis
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left card: Supply Chain Disruptions */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Supply Chain Disruptions
          </h3>

          {/* Stat boxes row */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <StatBox
              value={`+${data.shippingRateIncreasePct}%`}
              label="Shipping Rates"
              color="var(--danger)"
            />
            <StatBox
              value={`+${data.cpiImpactPct}%`}
              label="CPI Impact"
              color="var(--warning)"
            />
            <StatBox
              value={`${data.sprReserveDays}d`}
              label="SPR Reserve"
              color="var(--warning)"
            />
          </div>

          {/* Bullet points */}
          <ul className="flex flex-col gap-3">
            <BulletPoint text="Oil supertanker charter rates quadrupled; container shipping surcharges up to $3500 per TEU" />
            <BulletPoint
              text={`Brent crude surged from $80 to $120+/barrel; average cost inflation ${data.cpiImpactPct}% across consumer baskets`}
            />
            <BulletPoint text="Fertilizer shortage driving spring crop crisis; 30-35% of global exports normally transit Hormuz" />
            <BulletPoint
              text={`US Strategic Petroleum Reserve drawdown accelerating; estimated ${data.sprReserveDays} days remaining at current rate`}
            />
          </ul>
        </div>

        {/* Right card: Alternative Routes */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Alternative Routes
          </h3>

          <div className="divide-y divide-[var(--card-border)]">
            {data.alternativeRoutes.map((route, index) => (
              <div
                key={route.route}
                className={index === 0 ? "pb-4" : "py-4"}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {route.route}
                  </span>
                  <span className="rounded bg-[var(--warning)]/20 px-2 py-0.5 text-xs font-bold text-[var(--warning)]">
                    +{route.addedDays}D
                  </span>
                  <span className="rounded bg-[var(--danger)]/20 px-2 py-0.5 text-xs font-bold text-[var(--danger)]">
                    +{route.addedCost}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {route.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
