# Hormuz Signal Tracker

> 4 signals. Zero noise. Live at [hormuz-signal-tracker.vercel.app](https://hormuz-signal-tracker.vercel.app)

A public dashboard tracking the Strait of Hormuz crisis through the only signals that matter — priced by people with real money at risk.

The Strait of Hormuz carries 20% of the world's oil supply. When it closed in March 2026, most coverage was noise. This tracker cuts through it with 4 early warning signals, live futures data, and actionable trade intelligence.

## The 4 Signals

| Signal | What It Tracks | Why It Matters |
|--------|---------------|----------------|
| **Insurance Premiums** | War risk premium (% hull value) | Lloyd's underwriters price real risk — when premiums spike, smart money sees danger |
| **Strait Transits** | Daily AIS ship count | Physical proof — vessels either transit or they don't |
| **Paper vs Physical** | Brent futures vs Dubai physical spread | Refiners pay physical prices, not paper — this gap reveals the real cost |
| **Refining Margins** | Gasoline & heating oil crack spreads | When refiners can't afford crude, that's the signal to sell oil longs |

## Live Data Sources

- **Oil futures** (CL, BZ, RB, HO, NG) — Yahoo Finance, refreshed every 15 min
- **Crack spreads** — Calculated live from RBOB/HO vs WTI
- **Forward curve** — 9-month Brent curve with backwardation/contango detection
- **WTI-Brent spread** — Same-maturity contracts to avoid roll distortion
- **Hyperliquid perps** — 24/7 oil pricing when CME is closed
- **Market pulse** — S&P 500, NASDAQ, VIX, Gold, Bitcoin futures

## Dashboard Sections

1. **The Signal** — Verdict banner + 4 early warning signal cards with mini trend charts
2. **What Happens Next** — Critical deadlines with countdown timers
3. **Actionable Intelligence** — Energy futures desk, crack spreads, forward curve, tanker rates, trade expressions
4. **Deep Context** — Inflation threshold, recovery timeline, SPR status, demand destruction, Iranian attacks, vessel map, crisis timeline

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Recharts** for data visualization
- **Vercel** deployment with ISR (15-min revalidation)
- **No database** — JSON data file, manual updates via git push

## Data Updates

Signal data lives in `src/data/signals.json`. To update:

1. Edit the JSON values (insurance rate, ship count, spread, etc.)
2. Commit and push — Vercel redeploys in ~30 seconds

Live futures prices are fetched automatically from Yahoo Finance every 15 minutes.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables (Optional)

| Variable | Purpose |
|----------|---------|
| `SIGNAL_INSURANCE` | Override insurance premium (e.g. `5.8`) |
| `SIGNAL_SHIPS` | Override daily ship count (e.g. `15`) |

Set on Vercel for quick manual overrides without code changes.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Server component — loads all data
│   ├── layout.tsx            # Root layout with dark theme
│   └── api/                  # API routes (oil price, futures, cron)
├── components/
│   ├── Dashboard.tsx          # Main dashboard orchestrator
│   ├── VerdictBanner.tsx      # Composite signal verdict
│   ├── CrackSpreads.tsx       # Refining margins + HFI exit framework
│   ├── IranianAttacks.tsx     # Gulf state attack data (Bloomberg Intelligence)
│   ├── ForwardCurve.tsx       # Brent forward curve structure
│   ├── TankerRates.tsx        # VLCC/Suezmax/Aframax TCE rates
│   └── ...                    # 15+ signal and context components
├── data/
│   └── signals.json           # All signal data (single source of truth)
└── lib/
    ├── signals.ts             # Data loader with scraping infrastructure
    ├── futures-api.ts         # Yahoo Finance + Hyperliquid API clients
    ├── types.ts               # TypeScript definitions
    ├── utils.ts               # Signal status logic and formatters
    └── verdict.ts             # Composite signal scoring
```

## Signal Framework

Created by [Nakul Sarda](https://x.com/nakul_sarda) — the original thesis that insurance premiums, ship transits, oil spreads, and timeline events are the only signals worth watching during the Hormuz crisis.

Refining margins exit framework based on [HFI Research](https://x.com/HFI_Research) thesis — crack spreads as the leading indicator for crude oil topping.

## License

MIT
