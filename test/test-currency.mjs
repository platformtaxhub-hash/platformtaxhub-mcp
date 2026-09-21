import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: { ...process.env, NODE_OPTIONS: "--import ./test/test-proxy-setup.mjs" },
});
const client = new Client({ name: "test-client", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("=== ALL TOOLS ===");
console.log(tools.tools.map((t) => t.name).join(", "));

console.log("\n=== list_currency_takehome_countries (first 5) ===");
const rc = await client.callTool({ name: "list_currency_takehome_countries", arguments: {} });
console.log(JSON.parse(rc.content[0].text).slice(0, 5));

console.log("\n=== currency_takehome_calculator (Nigeria, 3 platforms -> NGN) ===");
const r1 = await client.callTool({
  name: "currency_takehome_calculator",
  arguments: {
    country: "NG",
    targetCurrency: "NGN",
    platforms: [
      { label: "YouTube", amount: 2500, currency: "USD", platformFeePercent: 45 },
      { label: "Direct Client", amount: 800, currency: "EUR", platformFeePercent: 0 },
      { label: "Upwork", amount: 1200, currency: "GBP", platformFeePercent: 10 },
    ],
  },
});
console.log(r1.content[0].text);

console.log("\n=== currency_takehome_calculator (bad country) ===");
const r2 = await client.callTool({
  name: "currency_takehome_calculator",
  arguments: { country: "ZZ", targetCurrency: "USD", platforms: [{ amount: 100, currency: "USD" }] },
});
console.log("isError:", r2.isError, "-", r2.content[0].text);

console.log("\n=== currency_takehome_calculator (single platform sanity check vs take_home_pay) ===");
const r3 = await client.callTool({
  name: "currency_takehome_calculator",
  arguments: { country: "US", targetCurrency: "USD", platforms: [{ label: "YouTube", amount: 5000, currency: "USD", platformFeePercent: 45 }] },
});
console.log(r3.content[0].text);

console.log("\n=== take_home_pay_calculator (uber-lyft, checking mileage cross-reference note) ===");
const r4 = await client.callTool({
  name: "take_home_pay_calculator",
  arguments: { platform: "uber-lyft", grossAmount: 3000 },
});
console.log(JSON.parse(r4.content[0].text).note);

console.log("\n=== list_platformtaxhub_tools ===");
const r5 = await client.callTool({ name: "list_platformtaxhub_tools", arguments: {} });
console.log(r5.content[0].text);

await client.close();
