# wavalid-ts-sdk

TypeScript SDK for the [wavalid](https://wavalid.com) WhatsApp number validation API. wavalid checks whether a phone number is registered and active on WhatsApp; it does not send messages and does not store phone numbers.

## Install

```bash
npm install wavalid-ts-sdk
```

Requires Node.js 18+ (uses the global `fetch`). Works in ESM and CJS.

## Authentication

Every request needs an API key, created from the wavalid dashboard. Never hardcode it — read it from an environment variable.

```ts
import { WavalidClient } from "wavalid-ts-sdk";

const client = new WavalidClient({
  apiKey: process.env.WAVALID_API_KEY!,
  baseUrl: "https://wavalid.com",
});
```

`baseUrl` is the root domain only — do not append `/api` or `/api/v1`, the client adds that path itself.

## `client.validate(input)`

Validates a single phone number.

```ts
validate(input: {
  phoneNumber: string;   // E.164 international format, e.g. "+14155551234"
  batchId?: number;      // optional, associates this check with an existing batch
}): Promise<{
  phoneNumber: string;
  status: "valid" | "invalid" | "limit"; // "limit" = account/provider limit reached for this check
  creditsRemaining: number;
}>
```

```ts
const result = await client.validate({ phoneNumber: "+14155551234" });
```

## `client.validateBulk(input)`

Validates up to 100 phone numbers in one request.

```ts
validateBulk(input: {
  phoneNumbers: string[]; // 1 to 100 numbers, E.164 format
  batchId?: number;
}): Promise<{
  results: { phoneNumber: string; status: "valid" | "invalid" }[];
  creditsUsed: number;
  creditsRemaining: number;
}>
```

```ts
const bulk = await client.validateBulk({
  phoneNumbers: ["+14155551234", "+447911123456"],
});
```

For more than 100 numbers, split the list into chunks of 100 and call `validateBulk` once per chunk.

## Errors

Both methods reject with `WavalidApiError` on any non-2xx response — always wrap calls in `try`/`catch`, never assume success.

```ts
export class WavalidApiError extends Error {
  statusCode: number;
  message: string;
  code?: string;
}
```

| statusCode | code                  | meaning                                                                                |
| ---------- | --------------------- | -------------------------------------------------------------------------------------- |
| 400        | (none)                | `phoneNumber` is not a valid international number, or `phoneNumbers` is empty/over 100 |
| 401        | (none)                | missing or invalid `apiKey`                                                            |
| 402        | `insufficientCredits` | account has no credits left                                                            |
| 404        | (none)                | `batchId` does not exist for this account                                              |
| 429        | `rateLimitExceeded`   | too many requests; back off (see `Retry-After` below)                                  |
| 502        | (none)                | upstream WhatsApp check failed; safe to retry                                          |

```ts
try {
  const result = await client.validate({ phoneNumber: "+14155551234" });
} catch (error) {
  if (error instanceof WavalidApiError) {
    if (error.code === "rateLimitExceeded") {
      // back off and retry later
    }
    console.error(error.statusCode, error.code, error.message);
    return;
  }
  throw error;
}
```

On a 429, the underlying HTTP response includes a `Retry-After` header (seconds to wait) — this SDK does not read it for you; inspect the response yourself if you need it, or just add a fixed backoff before retrying.

## Full example

```ts
import { WavalidClient, WavalidApiError } from "wavalid-ts-sdk";

const client = new WavalidClient({
  apiKey: process.env.WAVALID_API_KEY!,
  baseUrl: "https://wavalid.com",
});

async function main() {
  try {
    const single = await client.validate({ phoneNumber: "+14155551234" });
    console.log(single.status, single.creditsRemaining);

    const bulk = await client.validateBulk({
      phoneNumbers: ["+14155551234", "+447911123456"],
    });
    console.log(bulk.results, bulk.creditsUsed);
  } catch (error) {
    if (error instanceof WavalidApiError) {
      console.error(`wavalid error ${error.statusCode}: ${error.message}`);
      return;
    }
    throw error;
  }
}

main();
```

## Links

- API reference: https://wavalid.com/product/api
- Source / issues: https://github.com/rizonllc/wavalid-ts-sdk
- License: MIT
