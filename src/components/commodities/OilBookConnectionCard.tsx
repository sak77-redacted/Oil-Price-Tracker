"use client";

import Link from "next/link";

interface Props {
  text: string;
}

export default function OilBookConnectionCard({ text }: Props) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-zinc-950 to-emerald-950/20 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
          Connection to existing oil book
        </p>
        <div className="flex gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
          <Link href="/oil" className="text-white/55 hover:text-emerald-200">
            ← Oil tracker
          </Link>
          <span className="text-white/20">·</span>
          <Link href="/sugar" className="text-white/55 hover:text-emerald-200">
            Sugar trade →
          </Link>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/80">{text}</p>
    </div>
  );
}
