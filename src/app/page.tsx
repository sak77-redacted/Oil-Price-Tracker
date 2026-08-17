import type { Metadata } from "next";

import aiBubbleData from "@/data/ai-bubble.json";
import type { AIBubbleData } from "@/lib/ai-bubble-types";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AIVerdictBanner from "@/components/ai/AIVerdictBanner";
import StepUpLadder from "@/components/ai/StepUpLadder";
import WeeklyBrief from "@/components/ai/WeeklyBrief";
import StackDiagram from "@/components/ai/StackDiagram";
import BacklogSignal from "@/components/ai/BacklogSignal";
import CapexSignal from "@/components/ai/CapexSignal";
import ChinaShareSignal from "@/components/ai/ChinaShareSignal";
import RevenueSpeedSignal from "@/components/ai/RevenueSpeedSignal";
import PolicyWatch from "@/components/ai/PolicyWatch";
import ConcentrationSignal from "@/components/ai/ConcentrationSignal";
import TreasuryStackSignal from "@/components/ai/TreasuryStackSignal";
import SecuritizationSignal from "@/components/ai/SecuritizationSignal";
import IpoWatchSignal from "@/components/ai/IpoWatchSignal";

export const metadata: Metadata = {
  title: "AI Bubble Tracker — The 2006 Question",
  description:
    "Tracking the speed of the $2.1T AI financing structure. The step-up ladder, backlogs, capex, and China pressure — the structure fails when the numbers stop accelerating, not when they fall.",
  openGraph: {
    title: "AI Bubble Tracker — The 2006 Question",
    description:
      "Tracking the speed of the $2.1T AI financing structure. The structure fails when the numbers stop accelerating, not when they fall.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Bubble Tracker — The 2006 Question",
    description:
      "Tracking the speed of the $2.1T AI financing structure. Watch the speed, not the level.",
  },
};

function SectionDivider({ label, description }: { label: string; description?: string }) {
  return (
    <div className="mt-10 mb-6">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 text-sm font-extrabold uppercase tracking-[0.24em] text-white">
          {label}
        </h2>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
      {description && (
        <p className="mt-1.5 text-xs text-[var(--text-secondary)]">{description}</p>
      )}
    </div>
  );
}

export default function Home() {
  const data = aiBubbleData as unknown as AIBubbleData;
  const { meta, verdict, stack, signals, weeklyBrief } = data;

  return (
    <main className="flex min-h-full flex-col">
      <Nav />
      <div className="mx-auto max-w-7xl w-full px-4 pt-4 sm:px-6 lg:px-8">
        <p className="text-[10px] text-center text-[var(--text-secondary)]">
          Not financial advice. For informational purposes only. Do your own research before making investment decisions.
        </p>
      </div>

      <header className="px-4 pt-6 pb-2 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          AI Bubble Tracker
        </h1>
        <p className="mx-auto mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          Watch the speed. Not the level.
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
          $2.1 trillion in compute has been promised by companies that don&apos;t make money,
          collateralized by valuations that must keep stepping up to stay credible.
          We&apos;ve built this machine before — it broke in the year nobody remembers,
          when house prices rose 8% instead of 15%. This tracker watches the only thing
          that matters: whether the numbers are still accelerating.
        </p>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* ─── TIER 1 ─── */}
        <div className="mt-6 flex flex-col gap-6">
          <AIVerdictBanner verdict={verdict} meta={meta} capex={signals.capex} />
          <StepUpLadder signal={signals.stepUpLadder} />
          <IpoWatchSignal signal={signals.ipoWatch} />
          <WeeklyBrief brief={weeklyBrief} />
        </div>

        {/* ─── THE MACHINE ─── */}
        <SectionDivider
          label="The Machine"
          description="Three borrowers, one structure — each collateralized by a belief that must keep accelerating."
        />
        <StackDiagram stack={stack} />

        {/* ─── SPEED SIGNALS ─── */}
        <SectionDivider
          label="Speed Signals"
          description="Second-derivative watch: growth rates, not levels."
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BacklogSignal signal={signals.backlog} />
          <CapexSignal signal={signals.capex} />
          <ChinaShareSignal signal={signals.chinaShare} />
          <RevenueSpeedSignal signal={signals.revenueSpeed} />
        </div>

        {/* ─── STRUCTURE & POLICY ─── */}
        <SectionDivider
          label="Structure & Policy"
          description="What amplifies the unwind: policy, concentration, and the sovereign layer."
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SecuritizationSignal signal={signals.securitization} />
          <PolicyWatch signal={signals.policyWatch} />
          <ConcentrationSignal signal={signals.concentration} />
          <TreasuryStackSignal signal={signals.treasuryStack} />
        </div>
      </div>

      <Footer />
    </main>
  );
}
