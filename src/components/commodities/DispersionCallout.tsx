"use client";

interface Props {
  text: string;
}

export default function DispersionCallout({ text }: Props) {
  return (
    <div className="rounded-xl border-l-4 border-red-500 bg-gradient-to-r from-red-950/40 to-zinc-950 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-300">
        The Dispersion Opportunity
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">
        {text}
      </p>
    </div>
  );
}
