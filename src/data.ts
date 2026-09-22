// This package ships NO proprietary reference data (platform fees, currency
// tables, borderless-account comparisons). Every calculation that needs
// that data calls PlatformTaxHub's own compute-only API: the server does
// the math using data that lives only there, and returns just the
// computed result — the underlying tables never leave PlatformTaxHub's
// infrastructure. See callCompute() below.

export const MCP_COMPUTE_URL = "https://n8n.platformtaxhub.com/webhook/mcp-compute";

export interface ComputeResponse {
  isError: boolean;
  result: any;
}

export async function callCompute(tool: string, params: Record<string, unknown>): Promise<any> {
  const res = await fetch(MCP_COMPUTE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, params }),
  });
  if (!res.ok) {
    throw new Error(
      `platformtaxhub-mcp: compute API request failed (HTTP ${res.status}) for tool "${tool}".`
    );
  }
  const data = (await res.json()) as ComputeResponse;
  if (data.isError) {
    throw new Error(data.result?.error || `platformtaxhub-mcp: compute API returned an error for tool "${tool}".`);
  }
  return data.result;
}

// ── currency-takehome.html: exchange rates ────────────────────────────────
// Not proprietary — public FX rate lookups, kept client-side. MAJOR_CURRENCIES
// is just routing config (which of the two rate sources to use), not business
// data, so it stays a plain constant here rather than behind the compute API.
export const MAJOR_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "HKD",
  "SGD", "INR", "BRL", "ZAR", "MXN", "PLN", "CZK", "HUF", "TRY", "ILS",
  "AED", "SAR",
];
export const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest";
export const EXCHANGE_RATE_FUNCTION_URL = "https://platformtaxhub.com/.netlify/functions/get-exchange-rate";

// ── platform-payout-calendar.html: live data source (unchanged) ──────────
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
