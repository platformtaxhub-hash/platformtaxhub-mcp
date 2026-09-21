import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
    env: { ...process.env, NODE_OPTIONS: "--import ./test/test-proxy-setup.mjs" },
  });
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(transport);

  const tools = await client.listTools();
  console.log("=== TOOLS ===");
  console.log(tools.tools.map((t) => t.name).join(", "));

  console.log("\n=== list_take_home_platforms ===");
  const r1 = await client.callTool({ name: "list_take_home_platforms", arguments: {} });
  console.log(r1.content[0].text.slice(0, 300) + "...");

  console.log("\n=== take_home_pay_calculator (Uber/Lyft, $5000, txn on) ===");
  const r2 = await client.callTool({
    name: "take_home_pay_calculator",
    arguments: { platform: "uber-lyft", grossAmount: 5000, currency: "USD", period: "month", includeTransactionFee: true },
  });
  console.log(r2.content[0].text);

  console.log("\n=== take_home_pay_calculator (bad platform id) ===");
  const r2b = await client.callTool({
    name: "take_home_pay_calculator",
    arguments: { platform: "not-a-real-platform", grossAmount: 5000 },
  });
  console.log("isError:", r2b.isError, "-", r2b.content[0].text.slice(0, 120));

  console.log("\n=== list_payout_platforms (first 3) ===");
  const r3 = await client.callTool({ name: "list_payout_platforms", arguments: {} });
  console.log(JSON.parse(r3.content[0].text).slice(0, 3));

  console.log("\n=== platform_payout_calendar (youtube, upwork, instagram) ===");
  const r4 = await client.callTool({
    name: "platform_payout_calendar",
    arguments: { platformIds: ["youtube", "upwork", "instagram"], region: "us" },
  });
  console.log(r4.content[0].text);

  console.log("\n=== platform_payout_calendar (bad id) ===");
  const r4b = await client.callTool({
    name: "platform_payout_calendar",
    arguments: { platformIds: ["definitely-not-real"] },
  });
  console.log(r4b.content[0].text);

  console.log("\n=== list_benefits_countries (first 5) ===");
  const r5 = await client.callTool({ name: "list_benefits_countries", arguments: {} });
  console.log(JSON.parse(r5.content[0].text).slice(0, 5));

  console.log("\n=== benefits_safety_net_calculator (Nigeria, gig, 5%) ===");
  const r6 = await client.callTool({
    name: "benefits_safety_net_calculator",
    arguments: { country: "Nigeria", monthlyIncome: 400000, icp: "gig" },
  });
  console.log(r6.content[0].text);

  console.log("\n=== benefits_safety_net_calculator (with emergency buffer + bad country) ===");
  const r6b = await client.callTool({
    name: "benefits_safety_net_calculator",
    arguments: { country: "Wakanda", monthlyIncome: 1000 },
  });
  console.log("isError:", r6b.isError, "-", r6b.content[0].text.slice(0, 150));

  const r6c = await client.callTool({
    name: "benefits_safety_net_calculator",
    arguments: { country: "United States", monthlyIncome: 4000, icp: "freelancer", setAsidePercent: 8, emergencyPercent: 3 },
  });
  console.log(r6c.content[0].text);

  await client.close();
}

main().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
