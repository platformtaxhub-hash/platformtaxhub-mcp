// Data ported verbatim from platformincome.com's live tool pages, so the
// numbers this MCP server returns never drift from the numbers a human
// sees on the site. Whenever the site's source data changes, this file
// needs the matching update — grep the three source HTML files for these
// same values before assuming this is stale.

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

export const PLATFORM_FEES: PlatformFeeEntry[] = [
  { id: "youtube", name: "YouTube", category: "The Creator Economy", feePercent: 45 },
  { id: "tiktok", name: "TikTok", category: "The Creator Economy", feePercent: 50 },
  { id: "patreon-substack", name: "Patreon/Substack", category: "The Creator Economy", feePercent: 10 },
  { id: "onlyfans", name: "OnlyFans", category: "The Creator Economy", feePercent: 20 },
  { id: "uber-lyft", name: "Uber / Lyft", category: "The Gig Economy", feePercent: 25, txnFlat: 0.85, txnLabel: "Instant Pay fee" },
  { id: "bolt", name: "Bolt", category: "The Gig Economy", feePercent: 20 },
  { id: "indrive", name: "InDrive", category: "The Gig Economy", feePercent: 12, estimate: true, estimateLabel: "Modeled — negotiated" },
  { id: "doordash-deliveroo", name: "DoorDash / Deliveroo", category: "The Gig Economy", feePercent: 20 },
  { id: "upwork", name: "Upwork", category: "The Freelance Economy", feePercent: 10, txnFlat: 50, txnLabel: "Wire transfer fee" },
  { id: "fiverr", name: "Fiverr", category: "The Freelance Economy", feePercent: 20 },
  { id: "whop", name: "Whop", category: "The Digital Economy", feePercent: 3 },
  { id: "gumroad", name: "Gumroad", category: "The Digital Economy", feePercent: 10 },
  { id: "stan-store", name: "Stan Store", category: "The Digital Economy", feePercent: 0, flatFee: 29 },
  { id: "etsy", name: "Etsy", category: "The Marketplace Economy", feePercent: 6.5 },
  { id: "amazon", name: "Amazon", category: "The Ecommerce Economy", feePercent: 35 },
  { id: "tiktok-store", name: "TikTok Store", category: "The Ecommerce Economy", feePercent: 20 },
  { id: "airbnb", name: "Airbnb", category: "The Sharing Economy", feePercent: 15 },
  { id: "turo", name: "Turo", category: "The Sharing Economy", feePercent: 25 },
];

// value strings copied verbatim from the <select id="cur"> options — these
// double as both the ISO-ish code lookup key and the literal symbol
// prefixed onto formatted amounts, exactly as the live calculator does.
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", CAD: "C$", MXN: "MX$", BRL: "R$", ARS: "AR$", CLP: "CLP$", COP: "COL$", PEN: "S/",
  EUR: "€", GBP: "£", CHF: "CHF ", SEK: "SEK ", NOK: "NOK ", DKK: "DKK ", PLN: "zł", CZK: "Kč",
  HUF: "Ft", RON: "RON ", BGN: "лв", ISK: "kr", TRY: "₺", UAH: "₴",
  JPY: "¥", CNY: "CN¥", INR: "₹", AUD: "A$", NZD: "NZ$", SGD: "S$", HKD: "HK$", MYR: "RM",
  THB: "฿", IDR: "Rp", PHP: "₱", VND: "₫", KRW: "₩", TWD: "NT$", PKR: "₨", BDT: "৳",
  AED: "AED ", SAR: "SAR ", QAR: "QAR ", KWD: "KWD ", OMR: "OMR ", BHD: "BHD ", ILS: "₪",
  ZAR: "R", NGN: "₦", KES: "KSh", GHS: "GHS ", EGP: "E£", MAD: "MAD ",
};

export const PERIOD_DIVISORS: Record<string, number> = {
  day: 30,
  week: 4.33,
  month: 1,
  year: 1 / 12,
};

// ── benefits-safety-net.html: currencyData + icpData ─────────────────────
export const BENEFITS_CURRENCY_DATA: Record<string, { symbol: string; code: string }> = {
  "United States": { symbol: "$", code: "USD" },
  "Canada": { symbol: "$", code: "CAD" },
  "United Kingdom": { symbol: "£", code: "GBP" },
  "Australia": { symbol: "$", code: "AUD" },
  "Germany": { symbol: "€", code: "EUR" },
  "France": { symbol: "€", code: "EUR" },
  "Italy": { symbol: "€", code: "EUR" },
  "Spain": { symbol: "€", code: "EUR" },
  "Netherlands": { symbol: "€", code: "EUR" },
  "Sweden": { symbol: "kr", code: "SEK" },
  "Norway": { symbol: "kr", code: "NOK" },
  "Denmark": { symbol: "kr", code: "DKK" },
  "Switzerland": { symbol: "Fr", code: "CHF" },
  "Brazil": { symbol: "R$", code: "BRL" },
  "Mexico": { symbol: "$", code: "MXN" },
  "Argentina": { symbol: "$", code: "ARS" },
  "Chile": { symbol: "$", code: "CLP" },
  "Colombia": { symbol: "$", code: "COP" },
  "Peru": { symbol: "S/", code: "PEN" },
  "India": { symbol: "₹", code: "INR" },
  "Indonesia": { symbol: "Rp", code: "IDR" },
  "Philippines": { symbol: "₱", code: "PHP" },
  "Thailand": { symbol: "฿", code: "THB" },
  "Vietnam": { symbol: "₫", code: "VND" },
  "Malaysia": { symbol: "RM", code: "MYR" },
  "Singapore": { symbol: "$", code: "SGD" },
  "South Korea": { symbol: "₩", code: "KRW" },
  "Japan": { symbol: "¥", code: "JPY" },
  "China": { symbol: "¥", code: "CNY" },
  "Nigeria": { symbol: "₦", code: "NGN" },
  "Kenya": { symbol: "KSh", code: "KES" },
  "South Africa": { symbol: "R", code: "ZAR" },
  "Ghana": { symbol: "₵", code: "GHS" },
  "Uganda": { symbol: "USh", code: "UGX" },
  "Tanzania": { symbol: "TSh", code: "TZS" },
  "UAE": { symbol: "د.إ", code: "AED" },
  "Saudi Arabia": { symbol: "﷼", code: "SAR" },
  "Israel": { symbol: "₪", code: "ILS" },
  "Turkey": { symbol: "₺", code: "TRY" },
};

export const ICP_DATA: Record<string, { unit: string; perUnit: string }> = {
  gig: { unit: "gig", perUnit: "gig" },
  freelancer: { unit: "project", perUnit: "project" },
  creator: { unit: "upload", perUnit: "upload" },
  seller: { unit: "sale", perUnit: "sale" },
  host: { unit: "booking", perUnit: "booking" },
};

// ── currency-takehome.html: multi-platform/currency aggregation ──────────
// Ported from calculateMultiple() and its supporting tables. This is the
// genuine differentiator tool: combine several platforms' earnings, each
// in its own currency, into one converted total via the cheapest
// available international-account provider for the user's country.

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

export const BORDERLESS_ACCOUNTS: BorderlessProvider[] = [
  { id: "wise", name: "Wise", type: "global", countries: ["US","GB","CA","AU","DE","FR","ES","IT","NL","BR","MX","AR","CO","CL","PE","IN","ID","VN","TH","PH","MY","SG","PK","BD","LK","NP","NG","KE","GH","ZA","EG","TR","UA","PL","RO","CZ","HU","AE","IL","SA","JP","KR","CN","HK","TW"], fee: 0.8, fx: 0.5 },
  { id: "payoneer", name: "Payoneer", type: "global", countries: ["US","GB","CA","AU","DE","FR","ES","IT","NL","BR","MX","AR","CO","CL","PE","IN","ID","VN","TH","PH","MY","SG","PK","BD","LK","NP","NG","KE","GH","ZA","EG","TR","UA","PL","RO","CZ","HU","AE","IL","SA","JP","KR","CN","HK","TW"], fee: 1.0, fixed: 1.5, fx: 1.5 },
  { id: "airwallex", name: "Airwallex", type: "global", countries: ["US","GB","CA","AU","DE","FR","ES","IT","NL","BR","MX","AR","CO","CL","PE","IN","ID","VN","TH","PH","MY","SG","PK","BD","LK","NP","JP","KR","CN","HK","TW"], fee: 0.5, fx: 0.5 },
  { id: "revolut", name: "Revolut", type: "global", countries: ["US","GB","DE","FR","ES","IT","NL","PL","RO","CZ","HU","AU","SG","JP"], fee: 0.5, fx: 0.5 },
  { id: "worldfirst", name: "WorldFirst", type: "global", countries: ["US","GB","AU","SG","CN","IN","ID","VN","TH","PH","PK","BD","MY"], fee: 0, fx: 0.5 },
  { id: "mercury", name: "Mercury", type: "regional", countries: ["US"], fee: 0, fx: 0 },
  { id: "n26", name: "N26", type: "regional", countries: ["DE","FR","ES","IT","NL","AT","BE","PT","IE","GR"], fee: 0, fx: 0.5 },
  { id: "qonto", name: "Qonto", type: "regional", countries: ["FR","DE","ES","IT"], fee: 0, fx: 0.5 },
  { id: "aspire", name: "Aspire", type: "regional", countries: ["SG","ID","VN","TH","MY","PH"], fee: 0, fx: 0.8 },
  { id: "ipaylinks", name: "iPayLinks", type: "regional", countries: ["CN","SG","MY","ID","VN","TH","PH","NG"], fee: 0.8, fx: 0.8 },
  { id: "oceanpayment", name: "Oceanpayment", type: "regional", countries: ["CN","SG","MY","ID","VN","TH","PH"], fee: 0.8, fx: 0.8 },
  { id: "grey", name: "Grey", type: "regional", countries: ["NG","GH","KE"], fee: 0, feeModel: "flat", flatFee: 1, fx: 0.5 },
  { id: "raenest", name: "Raenest", type: "regional", countries: ["NG","GH","KE"], fee: 0, fx: 0.5 },
  { id: "onboard", name: "Onboard", type: "global", countries: ["US","CA","GB","DE","FR","ES","IT","NL","BR","MX","AR","CO","CL","PE","IN","ID","VN","TH","PH","PK","BD","LK","NP","NG","KE","GH","ZA","EG","TR","UA","PL","RO","CZ","HU","AE","IL","SA","JP","KR","SG","MY","HK","TW"], fee: 0.5, fx: 0.5 },
  { id: "pexx", name: "PEXX", type: "global", countries: ["US","CA","GB","DE","FR","ES","IT","NL","IN","ID","VN","TH","PH","MY","SG","JP","KR","HK","TW"], fee: 0.3, fx: 0.3 },
  { id: "due", name: "Due", type: "global", countries: ["US","CA","GB","DE","FR","ES","IT","NL","BR","MX","AR","CO","CL","PE","IN","ID","VN","TH","PH","MY","SG","JP","KR","HK","TW"], fee: 0.2, fx: 0.2 },
];

export const CURRENCY_TAKEHOME_COUNTRIES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia", DE: "Germany",
  FR: "France", ES: "Spain", IT: "Italy", NL: "Netherlands", BR: "Brazil", MX: "Mexico",
  AR: "Argentina", CO: "Colombia", CL: "Chile", PE: "Peru", IN: "India", ID: "Indonesia",
  VN: "Vietnam", TH: "Thailand", PH: "Philippines", MY: "Malaysia", SG: "Singapore",
  PK: "Pakistan", BD: "Bangladesh", LK: "Sri Lanka", NP: "Nepal", NG: "Nigeria", KE: "Kenya",
  GH: "Ghana", ZA: "South Africa", EG: "Egypt", TR: "Turkey", UA: "Ukraine", PL: "Poland",
  RO: "Romania", CZ: "Czech Republic", HU: "Hungary", AE: "UAE", IL: "Israel",
  SA: "Saudi Arabia", JP: "Japan", KR: "South Korea", CN: "China", HK: "Hong Kong", TW: "Taiwan",
};

// Exchange rates: major-pair rates come free/keyless from Frankfurter.dev
// (ECB data); everything else is routed through PlatformTaxHub's own
// Netlify function, which holds the ExchangeRate-API key server-side.
export const MAJOR_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "HKD", "SGD",
  "INR", "BRL", "ZAR", "MXN", "PLN", "CZK", "HUF", "TRY", "ILS", "AED", "SAR",
];
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
