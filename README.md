# wavalid-ts-sdk

TypeScript SDK for the [wavalid](https://wavalid.com) WhatsApp number validation API.

## Install

```bash
npm install wavalid-ts-sdk
```

## Usage

```ts
import { WavalidClient } from "wavalid-ts-sdk";

const client = new WavalidClient({
  apiKey: process.env.WAVALID_API_KEY!,
  baseUrl: "https://api.wavalid.com",
});

const result = await client.validate({ phoneNumber: "+15551234567" });
// { phoneNumber, status: "valid" | "invalid" | "limit", creditsRemaining }

const bulk = await client.validateBulk({
  phoneNumbers: ["+15551234567", "+447911123456"],
});
// { results: [{ phoneNumber, status }], creditsUsed, creditsRemaining }
```

Errors throw `WavalidApiError` with `statusCode`, `message`, and an optional `code`.
