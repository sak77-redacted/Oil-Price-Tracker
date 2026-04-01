export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mx-auto max-w-7xl border-t border-[var(--card-border)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">
          Hormuz Signal Tracker
        </p>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Data sources: Lloyd&apos;s market quotes, AIS tracking, Yahoo Finance,
          BCA Research
        </p>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Methodology: Signals are weighted by information quality. Insurance
          premiums (35%) carry the most weight — underwriters have billions at
          stake on every pricing call.
        </p>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Manual data updated daily. Oil prices refresh every 15 minutes.
        </p>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Signal framework by{" "}
          <a
            href="https://x.com/nakul_sarda"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Nakul Sarda
          </a>{" "}
          (@nakul_sarda) — Fund Manager &amp; Proprietary Investor, ProfitGate
          Group.
        </p>
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          Built for signal, not noise.
        </p>
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
          &copy; {currentYear}
        </p>
      </div>
    </footer>
  );
}
