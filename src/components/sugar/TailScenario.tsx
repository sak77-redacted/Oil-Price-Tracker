"use client";

import type { TailScenarioData } from "@/lib/sugar-types";
import SugarCard from "./SugarCard";

interface Props {
  data: TailScenarioData;
}

function isOffset(mmt: string): boolean {
  return mmt.trim().startsWith("-");
}

export default function TailScenario({ data }: Props) {
  return (
    <SugarCard
      title={data.title}
      subtitle="If Hormuz escalates beyond the oil-price channel into a real shipping/energy lockdown"
      badge={{ label: `${data.netDeficitMMT} MMT net deficit`, tone: "red" }}
      source="Internal decomposition · USDA/UNICA baselines"
      footnote={data.inelasticDemandNote}
    >
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/70 text-[10px] uppercase tracking-[0.16em] text-white/45">
                <th className="py-2 pr-3 font-semibold">Mechanism</th>
                <th className="py-2 pl-3 font-semibold text-right">MMT Lost</th>
              </tr>
            </thead>
            <tbody>
              {data.components.map((c) => {
                const offset = isOffset(c.mmtLost);
                return (
                  <tr key={c.mechanism} className="border-b border-zinc-800/40 last:border-0">
                    <td className="py-2.5 pr-3 align-top text-white/80">{c.mechanism}</td>
                    <td
                      className={`py-2.5 pl-3 align-top text-right tabular-nums font-semibold ${
                        offset ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {c.mmtLost}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-red-500/40 bg-red-500/10">
                <td className="py-3 pr-3 align-top font-bold text-white">Net deficit</td>
                <td className="py-3 pl-3 align-top text-right tabular-nums font-bold text-red-200">
                  {data.netDeficitMMT} MMT
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-relaxed text-amber-100/85">
          {data.context}
        </p>
      </div>
    </SugarCard>
  );
}
