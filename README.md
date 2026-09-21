[README.md](https://github.com/user-attachments/files/32470878/README.md)
# platformtaxhub-mcp

An [MCP](https://modelcontextprotocol.io) server exposing three free platform-income
calculators from [Platform Income Utils](https://platformincome.com) as tools any
MCP-compatible AI agent can call directly.

All three tools reuse the exact same math as the live web pages, so an agent's answer
never drifts from what a human sees on platformincome.com.

## Tools

### `take_home_pay_calculator`
Take-home pay after platform fees, optional ~2% currency-conversion cost, and optional
per-withdrawal transaction fees, across 18 gig/creator/freelance/ecommerce platforms.
Mirrors [`take-home-pay.html`](https://platformincome.com/take-home-pay.html).

### `list_take_home_platforms`
Lists every platform id/name/fee structure `take_home_pay_calculator` accepts.

### `platform_payout_calendar`
For one or more platforms, returns the next expected payout-initiated date and
bank-arrival date (payout date + regional transfer delay, pushed off weekends).
Fetches live data from the same source as
[`platform-payout-calendar.html`](https://platformincome.com/platform-payout-calendar.html),
so newly-added platforms or corrected schedules show up automatically with no server
redeploy needed.

### `list_payout_platforms`
Lists every platform id/name/verification-status `platform_payout_calendar` accepts
(live from the same data source).

### `benefits_safety_net_calculator`
For gig workers, freelancers, creators, sellers, and hosts with no employer benefits,
calculates a monthly self-funded health + retirement set-aside (default 5%, split
60/40), plus an optional emergency buffer. Mirrors
[`benefits-safety-net.html`](https://platformincome.com/benefits-safety-net.html).

### `list_benefits_countries`
Lists every country `benefits_safety_net_calculator` accepts, with its currency.

### `currency_takehome_calculator`
The genuine differentiator tool: combine earnings from several platforms, each in its
own currency, into one converted total via whichever international-account provider
(Wise, Payoneer, Airwallex, etc.) nets the most money for your country — using live
exchange rates. Most free take-home-pay calculators only handle one platform and one
currency at a time; this one is built specifically to answer "I earn from five
platforms in three currencies, what do I actually end up with?" Mirrors
[`currency-takehome.html`](https://platformincome.com/currency-takehome.html).

### `list_currency_takehome_countries`
Lists every country code `currency_takehome_calculator` accepts.

### `list_platformtaxhub_tools`
Lists every other free calculator on platformincome.com, including the ones not
wrapped as their own MCP tool here (mileage deduction, tax deadline clock, fees
comparison, and more) — so an agent can point a user to the right free tool even
when the question doesn't fit one of the tools above.

## Install & run

```bash
npx platformtaxhub-mcp
```

Or add it to your MCP client config (Claude Desktop, Claude Code, etc.):

```json
{
  "mcpServers": {
    "platformtaxhub": {
      "command": "npx",
      "args": ["-y", "platformtaxhub-mcp"]
    }
  }
}
```

No API key or account required — every tool here is free, matching the free tools on
platformincome.com.

## Development

```bash
npm install
npm run build
npm start
```

`src/data.ts` holds the platform-fee table and country/currency tables, ported
verbatim from the corresponding `<select>` options and JS objects in
`take-home-pay.html` and `benefits-safety-net.html`. If those change on the live
site, update `data.ts` to match. `platform_payout_calendar` has no static table to
maintain — it always fetches live from the same n8n webhook the calendar page uses.

## License

MIT — see the platformincome.com free tools this wraps for the calculators
themselves; this package is just the MCP interface to them.
