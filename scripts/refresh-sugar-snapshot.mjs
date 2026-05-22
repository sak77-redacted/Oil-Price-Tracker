#!/usr/bin/env node
/**
 * Refresh the executed sugar position snapshot in src/data/sugar.json.
 *
 * Two modes:
 *   Interactive:  node scripts/refresh-sugar-snapshot.mjs
 *   Flag-based:   node scripts/refresh-sugar-snapshot.mjs --mv 1850 --pnl -127 --iv 28.5
 *
 * Flags: --mv, --pnl, --iv, --delta, --gamma, --theta, --vega,
 *        --realized, --pct-portfolio, --oi, --profit-prob, --commit
 *
 * Press Enter at any interactive prompt to keep the current value.
 * Type 'auto' for unrealized P&L to derive it from new MV - cost basis.
 */

import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUGAR_JSON_PATH = resolve(__dirname, "..", "src", "data", "sugar.json");

// --- arg parsing -----------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next == null || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

const cliArgs = parseArgs(process.argv.slice(2));
const NON_INTERACTIVE = Object.keys(cliArgs).some((k) =>
  ["mv", "pnl", "iv", "delta", "gamma", "theta", "vega", "realized"].includes(k),
);

// --- helpers ---------------------------------------------------------------

function fmtMoney(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function nowIso() {
  // 2026-05-22T19:30:00 (local-naive, matches existing asOfDate format)
  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function parseNum(input, current, allowAuto = false) {
  if (input === "" || input == null) return current;
  if (allowAuto && input.toLowerCase() === "auto") return "AUTO";
  const cleaned = input.replace(/[$,\s]/g, "");
  const n = Number(cleaned);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid number: "${input}"`);
  }
  return n;
}

// --- prompting -------------------------------------------------------------

async function promptOrFlag(rl, label, current, flagValue, fmt = (x) => String(x), allowAuto = false) {
  if (flagValue != null) {
    if (allowAuto && String(flagValue).toLowerCase() === "auto") return "AUTO";
    const cleaned = String(flagValue).replace(/[$,\s]/g, "");
    const n = Number(cleaned);
    if (Number.isNaN(n)) throw new Error(`Invalid value for ${label}: "${flagValue}"`);
    return n;
  }
  if (NON_INTERACTIVE) return current;
  const hint = allowAuto ? " (or 'auto')" : "";
  const ans = (await rl.question(`  ${label} [${fmt(current)}]${hint}: `)).trim();
  return parseNum(ans, current, allowAuto);
}

// --- main ------------------------------------------------------------------

async function main() {
  const raw = await readFile(SUGAR_JSON_PATH, "utf8");
  const data = JSON.parse(raw);
  const pos = data.executedPosition;
  if (!pos) {
    console.error("✗ src/data/sugar.json has no executedPosition block.");
    process.exit(1);
  }

  console.log("");
  console.log("  Current sugar position snapshot");
  console.log("  ───────────────────────────────");
  console.log(`    As-of:           ${pos.asOfDate}`);
  console.log(`    Contract:        ${pos.contractLabel}`);
  console.log(`    Cost basis:      ${fmtMoney(pos.costBasisDollars)}`);
  console.log(`    Market value:    ${fmtMoney(pos.asOfMarketValueDollars)}`);
  console.log(`    Unrealized P&L:  ${fmtMoney(pos.asOfUnrealizedPnLDollars)}`);
  console.log(`    Realized P&L:    ${fmtMoney(pos.asOfRealizedPnLDollars)}`);
  console.log(`    IV:              ${fmtPct(pos.greeks.impliedVolPct)}`);
  console.log(`    Delta:           ${pos.greeks.delta}`);
  console.log(`    Pct portfolio:   ${fmtPct(pos.pctOfPortfolio)}`);
  console.log("");

  if (NON_INTERACTIVE) {
    console.log("  Mode: non-interactive (flags detected)");
  } else {
    console.log("  Enter new values (press Enter to keep current).");
  }
  console.log("");

  const rl = createInterface({ input: stdin, output: stdout });

  let newMV, newPnL, newIV, newDelta, newGamma, newTheta, newVega, newRealized, newPctPortfolio, newOI, newProfitProb;
  try {
    newMV = await promptOrFlag(rl, "Market value", pos.asOfMarketValueDollars, cliArgs.mv, fmtMoney);
    newPnL = await promptOrFlag(
      rl,
      "Unrealized P&L",
      pos.asOfUnrealizedPnLDollars,
      cliArgs.pnl,
      fmtMoney,
      true, // allow 'auto'
    );
    newRealized = await promptOrFlag(rl, "Realized P&L", pos.asOfRealizedPnLDollars, cliArgs.realized, fmtMoney);
    newIV = await promptOrFlag(rl, "IV %", pos.greeks.impliedVolPct, cliArgs.iv, (x) => `${x}%`);
    newDelta = await promptOrFlag(rl, "Delta", pos.greeks.delta, cliArgs.delta);
    newGamma = await promptOrFlag(rl, "Gamma", pos.greeks.gamma, cliArgs.gamma);
    newTheta = await promptOrFlag(rl, "Theta", pos.greeks.theta, cliArgs.theta);
    newVega = await promptOrFlag(rl, "Vega", pos.greeks.vega, cliArgs.vega);
    newPctPortfolio = await promptOrFlag(rl, "Pct of portfolio", pos.pctOfPortfolio, cliArgs["pct-portfolio"], fmtPct);
    newOI = await promptOrFlag(rl, "Open Interest", pos.openInterest, cliArgs.oi);
    newProfitProb = await promptOrFlag(rl, "Profit probability %", pos.profitProbabilityPct, cliArgs["profit-prob"], fmtPct);
  } catch (err) {
    rl.close();
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }

  // Resolve 'auto' P&L from new MV
  if (newPnL === "AUTO") {
    newPnL = newMV - pos.costBasisDollars;
    console.log(`    → Derived P&L: ${fmtMoney(newMV)} - ${fmtMoney(pos.costBasisDollars)} = ${fmtMoney(newPnL)}`);
  }

  const newAsOf = nowIso();

  console.log("");
  console.log("  Diff vs current");
  console.log("  ───────────────");
  const diff = (label, oldV, newV, fmt) => {
    const changed = oldV !== newV;
    const marker = changed ? "→" : "·";
    const newDisplay = changed ? fmt(newV) : "(unchanged)";
    console.log(`    ${marker} ${label.padEnd(20)} ${fmt(oldV).padStart(14)}  →  ${newDisplay}`);
  };
  diff("As-of", pos.asOfDate, newAsOf, (x) => String(x));
  diff("Market value", pos.asOfMarketValueDollars, newMV, fmtMoney);
  diff("Unrealized P&L", pos.asOfUnrealizedPnLDollars, newPnL, fmtMoney);
  diff("Realized P&L", pos.asOfRealizedPnLDollars, newRealized, fmtMoney);
  diff("IV %", pos.greeks.impliedVolPct, newIV, fmtPct);
  diff("Delta", pos.greeks.delta, newDelta, (x) => String(x));
  diff("Gamma", pos.greeks.gamma, newGamma, (x) => String(x));
  diff("Theta", pos.greeks.theta, newTheta, (x) => String(x));
  diff("Vega", pos.greeks.vega, newVega, (x) => String(x));
  diff("Pct portfolio", pos.pctOfPortfolio, newPctPortfolio, fmtPct);
  diff("Open Interest", pos.openInterest, newOI, (x) => String(x));
  diff("Profit probability", pos.profitProbabilityPct, newProfitProb, fmtPct);
  console.log("");

  // Confirm write
  let confirmed = NON_INTERACTIVE;
  if (!NON_INTERACTIVE) {
    const ans = (await rl.question("  Write to sugar.json? [Y/n]: ")).trim().toLowerCase();
    confirmed = ans === "" || ans === "y" || ans === "yes";
  }

  if (!confirmed) {
    console.log("  ✗ Aborted. No changes written.");
    rl.close();
    return;
  }

  // Apply
  data.executedPosition = {
    ...pos,
    asOfDate: newAsOf,
    asOfMarketValueDollars: newMV,
    asOfUnrealizedPnLDollars: newPnL,
    asOfRealizedPnLDollars: newRealized,
    pctOfPortfolio: newPctPortfolio,
    openInterest: newOI,
    profitProbabilityPct: newProfitProb,
    greeks: {
      ...pos.greeks,
      impliedVolPct: newIV,
      delta: newDelta,
      gamma: newGamma,
      theta: newTheta,
      vega: newVega,
    },
  };

  await writeFile(SUGAR_JSON_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`  ✓ Updated ${SUGAR_JSON_PATH}`);

  // Offer commit
  const wantsCommit = cliArgs.commit === true || cliArgs.commit === "true";
  let doCommit = wantsCommit;
  if (!NON_INTERACTIVE && !wantsCommit) {
    const ans = (await rl.question("  Commit changes? [y/N]: ")).trim().toLowerCase();
    doCommit = ans === "y" || ans === "yes";
  }
  rl.close();

  if (doCommit) {
    try {
      const msg = `Refresh sugar position snapshot — MV ${fmtMoney(newMV)}, P&L ${fmtMoney(newPnL)}, IV ${fmtPct(newIV)}`;
      execSync(`git add src/data/sugar.json && git commit -m "${msg.replace(/"/g, '\\"')}"`, {
        stdio: "inherit",
      });
      console.log("  ✓ Committed.");
    } catch (err) {
      console.error("  ✗ Commit failed (working tree may have other changes). Run git status to inspect.");
    }
  } else {
    console.log("  Tip: run `git diff src/data/sugar.json` to inspect, then commit when ready.");
  }
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
