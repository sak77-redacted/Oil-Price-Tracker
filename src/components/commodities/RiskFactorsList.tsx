"use client";

interface Props {
  factors: string[];
}

export default function RiskFactorsList({ factors }: Props) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-5">
      <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-red-300">
        What kills this trade
      </h4>
      <ul className="mt-3 flex flex-col gap-2">
        {factors.map((f, i) => (
          <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-white/75">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
