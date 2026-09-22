// Static reference data (platform fees, currency tables, borderless-account
// comparisons, etc.) is NOT hardcoded here. It is fetched at server startup
// from PlatformTaxHub's own API, so this open-source package never ships a
// standalone copy of that dataset. See loadStaticData() below.

// ── take-home-pay.html: <select id="platform"> options ──────────────────
// value = platform fee %. data-flat = flat fee overriding the %.
// data-txn-flat / data-txn-label = optional per-withdrawal transaction fee.
// data-estimate / data-estimate-label = modeled/estimated-rate disclosure.
export interface PlatformFeeEntry {
  id: string;
  name: string;
  category: string;
  feePercent: number;
  flatFee?: number;
  txnFlat?: number;
  txnLabel?: string;
  estimate?: boolean;
  estimateLabel?: string;
}

export let PLATFORM_FEES: PlatformFeeEntry[] = [];

export let CURRENCY_SYMBOLS: Record<string, string> = {};

export let PERIOD_DIVISORS: Record<string, number> = {};

// ── benefits-safety-net.html: currencyData + icpData ─────────────────────
export let BENEFITS_CURRENCY_DATA: Record<string, { symbol: string; code: string }> = {};

export let ICP_DATA: Record<string, { unit: string; perUnit: string }> = {};

// ── currency-takehome.html: multi-platform/currency aggregation ──────────
// This is the genuine differentiator tool: combine several platforms'
// earnings, each in its own currency, into one converted total via the
// cheapest available international-account provider for the user's country.

export interface BorderlessProvider {
  id: string;
  name: string;
  type: "global" | "regional";
  countries: string[]; // 2-letter country codes
  fee: number; // % fee on the transfer, unless feeModel === 'flat'
  fixed?: number; // flat $ fee added on top of the % fee
  fx: number; // % FX markup
  feeModel?: "flat";
  flatFee?: number; // used when feeModel === 'flat', replaces fee/fixed
}

export let BORDERLESS_ACCOUNTS: BorderlessProvider[] = [];

export let CURRENCY_TAKEHOME_COUNTRIES: Record<string, string> = {};

// Exchange rates: major-pair rates come free/keyless from Frankfurter.dev
// (ECB data); everything else is routed through PlatformTaxHub's own
// Netlify function, which holds the ExchangeRate-API key server-side.
export let MAJOR_CURRENCIES: string[] = [];
export const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest";
export const EXCHANGE_RATE_FUNCTION_URL = "https://platformtaxhub.com/.netlify/functions/get-exchange-rate";

// ── platform-payout-calendar.html: live data source ───────────────────────
export const PAYOUT_DATA_API = "https://n8n.platformtaxhub.com/webhook/platform-payout-data";

export interface PayoutDay {
  type: "day" | "range" | "weekday" | "" | string;
  day?: number;
  min?: number;
  max?: number;
}

export interface PlatformPayoutEntry {
  id: string;
  name: string;
  icon?: string;
  schedule: string;
  payoutDay: PayoutDay;
  payoutMonthOffset: number | "";
  minThreshold: number | "";
  verified: boolean;
  estimated: boolean;
  arrivalDelayDays: number | "";
  unverifiedReason?: string;
  estimateNote?: string;
}

export interface RegionDelay {
  label: string;
  days: number;
}

export interface PayoutDataResponse {
  PLATFORM_DATA: PlatformPayoutEntry[];
  REGION_DELAYS: Record<string, RegionDelay>;
}

// ── Static data loader ────────────────────────────────────────────────────
// Fetches the platform-fee / currency / borderless-account tables from
// PlatformTaxHub's own API at startup and populates the exports above via
// live ES-module bindings. main() in index.ts awaits this before the MCP
// transport connects, so every tool handler sees fully-populated data.
export const STATIC_DATA_URL = "https://platformincome.com/mcp-data.json";

interface StaticDataPayload {
  PLATFORM_FEES: PlatformFeeEntry[];
  CURRENCY_SYMBOLS: Record<string, string>;
  PERIOD_DIVISORS: Record<string, number>;
  BENEFITS_CURRENCY_DATA: Record<string, { symbol: string; code: string }>;
  ICP_DATA: Record<string, { unit: string; perUnit: string }>;
  BORDERLESS_ACCOUNTS: BorderlessProvider[];
  CURRENCY_TAKEHOME_COUNTRIES: Record<string, string>;
  MAJOR_CURRENCIES: string[];
}

export async function loadStaticData(): Promise<void> {
  const res = await fetch(STATIC_DATA_URL);
  if (!res.ok) {
    throw new Error(
      `platformtaxhub-mcp: failed to load static reference data from ${STATIC_DATA_URL} (HTTP ${res.status}). The server cannot start without it.`
    );
  }
  const data = (await res.json()) as StaticDataPayload;

  PLATFORM_FEES = data.PLATFORM_FEES;
  CURRENCY_SYMBOLS = data.CURRENCY_SYMBOLS;
  PERIOD_DIVISORS = data.PERIOD_DIVISORS;
  BENEFITS_CURRENCY_DATA = data.BENEFITS_CURRENCY_DATA;
  ICP_DATA = data.ICP_DATA;
  BORDERLESS_ACCOUNTS = data.BORDERLESS_ACCOUNTS;
  CURRENCY_TAKEHOME_COUNTRIES = data.CURRENCY_TAKEHOME_COUNTRIES;
  MAJOR_CURRENCIES = data.MAJOR_CURRENCIES;
}
