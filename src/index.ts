#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  callCompute,
  PAYOUT_DATA_API,
  PayoutDataResponse,
  PlatformPayoutEntry,
  MAJOR_CURRENCIES,
  FRANKFURTER_URL,
  EXCHANGE_RATE_FUNCTION_URL,
} from "./data.js";

const server = new McpServer({
  name: "platformtaxhub-mcp",
  version: "1.2.0",
  description:
    "Free platform-income calculators from PlatformTaxHub / Platform Income Utils (platformincome.com) — take-home pay after platform fees, platform payout-arrival dates, gig/freelance benefits safety-net set-aside amounts, and combined multi-platform/multi-currency income conversion. Covers 18+ platforms and 40+ countries.",
});

// ── Tool 1: take_home_pay_calculator ──────────────────────────────────────

server.registerTool(
  "take_home_pay_calculator",
  {
    title: "Take-Home Pay Calculator",
    description:
      "Calculate actual take-home pay after platform fees, optional currency-conversion cost (~2%), and optional per-withdrawal transaction fees, for 18 gig/creator/freelance/ecommerce platforms (Uber, YouTube, Upwork, Etsy, Airbnb, and more). Mirrors platformincome.com/take-home-pay.html exactly. Call list_take_home_platforms first if you don't already know a platform's id.",
    inputSchema: {
      platform: z
        .string()
        .describe(
          "Platform id, e.g. 'uber-lyft', 'youtube', 'upwork'. Call list_take_home_platforms to see all valid ids."
        ),
      grossAmount: z.number().positive().describe("Gross monthly earnings, before any fees."),
      currency: z
        .string()
        .default("USD")
        .describe("3-letter currency code, e.g. USD, GBP, EUR, NGN, INR. Defaults to USD."),
      period: z
        .enum(["day", "week", "month", "year"])
        .default("month")
        .describe("Period to express the result in. grossAmount is always treated as a MONTHLY figure; period only changes the display breakdown."),
      includeCurrencyConversion: z
        .boolean()
        .default(false)
        .describe("Add an estimated 2% currency-conversion cost on top of the platform fee."),
      includeTransactionFee: z
        .boolean()
        .default(false)
        .describe("Add the platform's per-withdrawal transaction fee, where one applies (e.g. Uber Instant Pay, Upwork wire transfer). Ignored for platforms with no transaction fee."),
    },
  },
  async ({ platform, grossAmount, currency, period, includeCurrencyConversion, includeTransactionFee }) => {
    try {
      const result = await callCompute("take_home_pay", {
        platform,
        grossAmount,
        currency,
        period,
        includeCurrencyConversion,
        includeTransactionFee,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  }
);

server.registerTool(
  "list_take_home_platforms",
  {
    title: "List platforms supported by the take-home pay calculator",
    description:
      "Returns every platform id, display name, category, and fee structure supported by take_home_pay_calculator.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await callCompute("list_platforms", {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  }
);

// ── Tool 2: platform_payout_calendar ──────────────────────────────────────
// Unchanged — this one already worked as a live, server-computed lookup
// rather than shipping raw data in the package.

function getPayoutDate(platform: PlatformPayoutEntry, baseMonth: Date): Date | null {
  if (!platform.payoutDay || !platform.payoutDay.type) return null;
  const year = baseMonth.getFullYear();
  const month = baseMonth.getMonth();
  const offset = typeof platform.payoutMonthOffset === "number" ? platform.payoutMonthOffset : 0;
  const targetMonth = (month + offset) % 12;
  const targetYear = year + Math.floor((month + offset) / 12);

  const pd = platform.payoutDay;
  let day = 15;
  if (pd.type === "day" && typeof pd.day === "number") {
    day = pd.day;
  } else if (pd.type === "range" && typeof pd.min === "number" && typeof pd.max === "number") {
    day = Math.floor((pd.min + pd.max) / 2);
  } else if (pd.type === "weekday" && typeof pd.day === "number") {
    const first = new Date(targetYear, targetMonth, 1);
    const dow = first.getDay();
    let diff = pd.day - dow;
    if (diff < 0) diff += 7;
    day = 1 + diff;
  }
  return new Date(targetYear, targetMonth, day);
}

function getArrivalDate(
  payoutDate: Date,
  region: string,
  platform: PlatformPayoutEntry,
  regionDelays: PayoutDataResponse["REGION_DELAYS"]
): Date {
  const bankDays =
    typeof platform.arrivalDelayDays === "number" ? platform.arrivalDelayDays : regionDelays[region]?.days ?? 5;
  const arrival = new Date(payoutDate);
  arrival.setDate(arrival.getDate() + bankDays);
  const dow = arrival.getDay();
  if (dow === 6) arrival.setDate(arrival.getDate() + 2);
  else if (dow === 0) arrival.setDate(arrival.getDate() + 1);
  return arrival;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

let payoutDataCache: { data: PayoutDataResponse; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchPayoutData(): Promise<PayoutDataResponse> {
  if (payoutDataCache && Date.now() - payoutDataCache.fetchedAt < CACHE_TTL_MS) {
    return payoutDataCache.data;
  }
  const res = await fetch(PAYOUT_DATA_API);
  if (!res.ok) throw new Error(`Payout data request failed: ${res.status}`);
  const data = (await res.json()) as PayoutDataResponse;
  if (!Array.isArray(data.PLATFORM_DATA) || !data.REGION_DELAYS) {
    throw new Error("Payout data response was malformed");
  }
  payoutDataCache = { data, fetchedAt: Date.now() };
  return data;
}

server.registerTool(
  "list_payout_platforms",
  {
    title: "List platforms supported by the payout calendar",
    description:
      "Returns every platform id and name currently tracked by platform_payout_calendar, live from platformincome.com's data source, including which ones have no verified schedule yet.",
    inputSchema: {},
  },
  async () => {
    const data = await fetchPayoutData();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            data.PLATFORM_DATA.map((p) => ({
              id: p.id,
              name: p.name,
              schedule: p.schedule || "unverified",
              verified: p.verified,
              estimated: p.estimated,
              unverifiedReason: p.unverifiedReason ?? null,
            })),
            null,
            2
          ),
        },
      ],
    };
  }
);

server.registerTool(
  "platform_payout_calendar",
  {
    title: "Platform Payout Calendar",
    description:
      "Given one or more platforms, returns when their next payout is expected to be initiated and when it should actually arrive in your bank account (payout date plus regional bank-transfer delay, pushed off weekends). Mirrors platformincome.com/platform-payout-calendar.html exactly, using the same live data source. Call list_payout_platforms first if you don't already know a platform's id.",
    inputSchema: {
      platformIds: z
        .array(z.string())
        .min(1)
        .describe("One or more platform ids, e.g. ['youtube', 'upwork', 'airbnb']. Call list_payout_platforms to see all valid ids."),
      month: z
        .string()
        .optional()
        .describe("Month to check, as YYYY-MM (e.g. '2026-10'), for looking up a specific past or future month. If omitted, the tool instead returns each platform's actual NEXT upcoming payout (rolling forward past any already-happened date in the current month)."),
      region: z
        .enum(["us", "uk", "eu", "au", "ca", "int"])
        .default("int")
        .describe("Region, used for the default bank-transfer delay when a platform doesn't publish its own. Defaults to 'int' (International, 5 days)."),
    },
  },
  async ({ platformIds, month, region }) => {
    let data: PayoutDataResponse;
    try {
      data = await fetchPayoutData();
    } catch (e: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Could not load live payout data: ${e.message}` }],
      };
    }

    let baseMonth: Date;
    if (month) {
      const m = /^(\d{4})-(\d{2})$/.exec(month);
      if (!m) {
        return { isError: true, content: [{ type: "text", text: "month must be in YYYY-MM format." }] };
      }
      baseMonth = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, 1);
    } else {
      const now = new Date();
      baseMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const explicitMonth = !!month;
    const today = new Date();

    const results = platformIds.map((id) => {
      const platform = data.PLATFORM_DATA.find((p) => p.id === id);
      if (!platform) {
        const ids = data.PLATFORM_DATA.map((p) => p.id).join(", ");
        return { platformId: id, error: `Unknown platform id. Valid ids: ${ids}` };
      }

      let cursor = new Date(baseMonth);
      let payoutDate = getPayoutDate(platform, cursor);
      if (!payoutDate) {
        return {
          platformId: id,
          platform: platform.name,
          verified: false,
          reason: platform.unverifiedReason || "No verified payout schedule for this platform.",
        };
      }
      let arrivalDate = getArrivalDate(payoutDate, region, platform, data.REGION_DELAYS);

      if (!explicitMonth) {
        let guard = 0;
        while (arrivalDate.getTime() < today.getTime() && guard < 60) {
          if (platform.schedule === "weekly") {
            payoutDate.setDate(payoutDate.getDate() + 7);
          } else {
            cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
            const next = getPayoutDate(platform, cursor);
            if (!next) break;
            payoutDate = next;
          }
          arrivalDate = getArrivalDate(payoutDate, region, platform, data.REGION_DELAYS);
          guard++;
        }
      }

      const daysFromToday = Math.round((arrivalDate.getTime() - today.getTime()) / 86400000);

      return {
        platformId: id,
        platform: platform.name,
        schedule: platform.schedule,
        verified: platform.verified,
        estimated: platform.estimated,
        estimateNote: platform.estimateNote ?? null,
        minThreshold: platform.minThreshold || null,
        payoutInitiated: fmtDate(payoutDate),
        expectedArrival: fmtDate(arrivalDate),
        daysFromToday,
      };
    });

    return { content: [{ type: "text", text: JSON.stringify({ month: `${baseMonth.getFullYear()}-${String(baseMonth.getMonth() + 1).padStart(2, "0")}`, region, results }, null, 2) }] };
  }
);

// ── Tool 3: benefits_safety_net_calculator ────────────────────────────────

server.registerTool(
  "list_benefits_countries",
  {
    title: "List countries supported by the benefits safety net calculator",
    description: "Returns every country id (and its currency) supported by benefits_safety_net_calculator.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await callCompute("list_benefits_countries", {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  }
);

server.registerTool(
  "benefits_safety_net_calculator",
  {
    title: "Benefits Safety Net Calculator",
    description:
      "For gig workers, freelancers, creators, sellers, and hosts with no employer-provided benefits, calculates a monthly set-aside for a self-funded health + retirement safety net (default 5% of income, split 60% health / 40% retirement), plus an optional emergency buffer. Mirrors platformincome.com/benefits-safety-net.html exactly. Call list_benefits_countries first if you don't already know a country's exact name.",
    inputSchema: {
      country: z.string().describe("Country name exactly as returned by list_benefits_countries, e.g. 'United States', 'Nigeria', 'India'."),
      monthlyIncome: z.number().positive().describe("Monthly platform income/earnings target."),
      icp: z
        .enum(["gig", "freelancer", "creator", "seller", "host"])
        .default("gig")
        .describe("Which kind of platform earner this is for — only changes the wording of the per-unit breakdown, not the math."),
      setAsidePercent: z
        .number()
        .positive()
        .default(5)
        .describe("Total % of monthly income to set aside. Defaults to 5% (the recommended baseline), split 60% health / 40% retirement."),
      emergencyPercent: z
        .number()
        .min(0)
        .default(0)
        .describe("Optional additional % of monthly income for an emergency buffer, on top of the baseline set-aside. Defaults to 0 (off)."),
    },
  },
  async ({ country, monthlyIncome, icp, setAsidePercent, emergencyPercent }) => {
    try {
      const result = await callCompute("benefits_safety_net", {
        country,
        monthlyIncome,
        icp,
        setAsidePercent,
        emergencyPercent,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  }
);

// ── Tool 4: currency_takehome_calculator ──────────────────────────────────
// The genuine differentiator: combine earnings from several platforms,
// each in its own currency, into one converted total via whichever
// available international-account provider nets the most money for the
// user's country. Exchange-rate lookups stay client-side (not proprietary);
// the provider comparison itself is computed server-side via callCompute,
// so the raw provider fee/FX table never leaves PlatformTaxHub's API.

const rateCache = new Map<string, { rate: number; fetchedAt: number }>();
const RATE_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h, matches the live page

async function getExchangeRate(fromCur: string, toCur: string): Promise<number> {
  if (fromCur === toCur) return 1;
  const cacheKey = `${fromCur}-${toCur}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < RATE_CACHE_TTL_MS) return cached.rate;

  const useMajorAPI = MAJOR_CURRENCIES.includes(fromCur) && MAJOR_CURRENCIES.includes(toCur);
  let rate: number;
  if (useMajorAPI) {
    const res = await fetch(`${FRANKFURTER_URL}?base=${fromCur}&symbols=${toCur}`);
    if (!res.ok) throw new Error(`Frankfurter API failed: ${res.status}`);
    const data: any = await res.json();
    rate = data.rates?.[toCur];
    if (typeof rate !== "number") throw new Error("Frankfurter API returned no rate for that pair");
  } else {
    const res = await fetch(`${EXCHANGE_RATE_FUNCTION_URL}?from=${fromCur}&to=${toCur}`);
    if (!res.ok) throw new Error(`Exchange rate lookup failed: ${res.status}`);
    const data: any = await res.json();
    if (typeof data.rate !== "number") throw new Error("Exchange rate function returned an invalid rate");
    rate = data.rate;
  }
  rateCache.set(cacheKey, { rate, fetchedAt: Date.now() });
  return rate;
}

server.registerTool(
  "list_currency_takehome_countries",
  {
    title: "List countries supported by the combined income calculator",
    description:
      "Returns every country code/name currency_takehome_calculator accepts, used to filter which international-account providers (Wise, Payoneer, etc.) are available.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await callCompute("list_currency_countries", {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  }
);

server.registerTool(
  "currency_takehome_calculator",
  {
    title: "Combined Multi-Platform / Multi-Currency Take-Home Calculator",
    description:
      "The one tool that answers 'I earn from several platforms, in several currencies — how much do I actually end up with in my own currency?' Give it a list of platform earnings (each with its own currency and platform fee %), plus your country and target currency, and it converts and combines them all through whichever international-account provider (Wise, Payoneer, Airwallex, etc.) nets you the most money — using live exchange rates, not estimates. This aggregation-across-platforms capability is not something other free take-home-pay calculators do; most only handle one platform and one currency at a time. Mirrors platformincome.com/currency-takehome.html exactly. Call list_currency_takehome_countries first if you don't know a country's 2-letter code.",
    inputSchema: {
      country: z
        .string()
        .describe("2-letter country code you'll receive the money in, e.g. 'US', 'NG', 'IN'. Call list_currency_takehome_countries for the full list."),
      targetCurrency: z.string().describe("3-letter currency code to convert everything into, e.g. 'USD', 'NGN', 'EUR'."),
      platforms: z
        .array(
          z.object({
            label: z.string().optional().describe("Optional display name for this row, e.g. 'YouTube', 'Direct Client A'."),
            amount: z.number().positive().describe("Gross earnings from this platform, in its own currency."),
            currency: z.string().describe("3-letter currency code this platform paid out in, e.g. 'USD', 'EUR'."),
            platformFeePercent: z
              .number()
              .min(0)
              .max(100)
              .default(0)
              .describe("This platform's own fee %, deducted before conversion. Use 0 for a direct client with no platform cut. Check list_take_home_platforms for typical fee %s by platform."),
          })
        )
        .min(1)
        .describe("One entry per platform/income source you want combined into a single total."),
    },
  },
  async ({ country, targetCurrency, platforms }) => {
    const countryCode = country.toUpperCase();
    const toCur = targetCurrency.toUpperCase();

    const uniqueFromCurrencies = [...new Set(platforms.map((r) => r.currency.toUpperCase()))];
    const rateMap: Record<string, number> = {};
    try {
      for (const fc of uniqueFromCurrencies) {
        rateMap[fc] = await getExchangeRate(fc, toCur);
      }
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: `Exchange rate lookup failed: ${e.message}` }] };
    }

    let totalGrossInToCur = 0;
    const convertedPlatforms = platforms.map((r) => {
      const rate = rateMap[r.currency.toUpperCase()];
      const afterPlatform = r.amount * (1 - r.platformFeePercent / 100);
      totalGrossInToCur += r.amount * rate;
      return { afterPlatformConverted: afterPlatform * rate };
    });

    let computeResult: any;
    try {
      computeResult = await callCompute("currency_takehome", {
        countryCode,
        toCur,
        totalGrossInToCur,
        convertedPlatforms,
      });
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }

    const result = {
      country: computeResult.country,
      targetCurrency: toCur,
      platformCount: platforms.length,
      platforms: platforms.map((r) => ({
        label: r.label || r.currency,
        amount: r.amount,
        currency: r.currency.toUpperCase(),
        platformFeePercent: r.platformFeePercent,
      })),
      combinedGrossConverted: computeResult.combinedGrossConverted,
      bestProvider: computeResult.bestProvider,
      allProviders: computeResult.allProviders,
      note: "Uses live exchange rates. Provider fees/FX markups are current as of PlatformTaxHub's own data — always verify final terms with the provider directly before choosing one to open an account with.",
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── Discovery: other free platformincome.com tools not wrapped as MCP tools ──

server.registerTool(
  "list_platformtaxhub_tools",
  {
    title: "List all PlatformTaxHub / Platform Income Utils free tools",
    description:
      "Returns the full list of platformincome.com's free calculators, including ones not exposed as their own MCP tool here (mileage deduction, tax deadline clock, fees comparison, and more). Use this when a user's question is about platform income but doesn't fit take_home_pay_calculator, platform_payout_calendar, benefits_safety_net_calculator, or currency_takehome_calculator.",
    inputSchema: {},
  },
  async () => {
    const tools = [
      { name: "Take-Home Pay Calculator", url: "https://platformincome.com/take-home-pay.html", note: "Also available directly as the take_home_pay_calculator tool." },
      { name: "Platform Payout Calendar", url: "https://platformincome.com/platform-payout-calendar.html", note: "Also available directly as the platform_payout_calendar tool." },
      { name: "Benefits Safety Net Calculator", url: "https://platformincome.com/benefits-safety-net.html", note: "Also available directly as the benefits_safety_net_calculator tool." },
      { name: "Currency Take-Home Calculator", url: "https://platformincome.com/currency-takehome.html", note: "Also available directly as the currency_takehome_calculator tool." },
      { name: "Mileage Deduction Calculator", url: "https://platformincome.com/mileage-deduction-calculator.html", note: "For drivers — deductible mileage by country, including platform-specific versions for Uber, Bolt, DoorDash, and more." },
      { name: "Multi-App Mileage Calculator", url: "https://platformincome.com/multi-app-mileage-calculator.html", note: "Combines mileage across multiple driving apps." },
      { name: "Tax Deadline Clock", url: "https://platformincome.com/tax-deadline-clock.html", note: "Countdown to the next tax filing/payment deadline, by country." },
      { name: "Making Tax Digital Checker", url: "https://platformincome.com/making-tax-digital-checker.html", note: "UK-specific — checks MTD for Income Tax eligibility and combines income across platforms." },
      { name: "Platform Fees Comparison", url: "https://platformincome.com/platform-fees-comparison.html", note: "Side-by-side platform fee comparison." },
    ];
    return { content: [{ type: "text", text: JSON.stringify(tools, null, 2) }] };
  }
);

// ── Start ──────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("platformtaxhub-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting platformtaxhub-mcp:", err);
  process.exit(1);
});
