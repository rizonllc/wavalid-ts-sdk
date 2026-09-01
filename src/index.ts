export type WhatsappNumberStatus = "valid" | "invalid" | "limit";

export type ValidateNumberResult = {
  phoneNumber: string;
  status: WhatsappNumberStatus;
  creditsRemaining: number;
};

export type ValidateBulkResult = {
  results: { phoneNumber: string; status: "valid" | "invalid" }[];
  creditsUsed: number;
  creditsRemaining: number;
};

export class WavalidApiError extends Error {
  public statusCode;
  public code;

  public constructor(payload: {
    statusCode: number;
    message: string;
    code?: string;
  }) {
    super(payload.message);
    this.statusCode = payload.statusCode;
    this.code = payload.code;
  }
}

export type WavalidClientOptions = {
  apiKey: string;
  baseUrl: string;
};

export class WavalidClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  public constructor(options: WavalidClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  public async validate(input: {
    phoneNumber: string;
    batchId?: number;
  }): Promise<ValidateNumberResult> {
    return this.request("/v1/validate", input);
  }

  public async validateBulk(input: {
    phoneNumbers: string[];
    batchId?: number;
  }): Promise<ValidateBulkResult> {
    return this.request("/v1/validate/bulk", input);
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new WavalidApiError({
        statusCode: data.statusCode ?? response.status,
        message: data.message ?? "Something went wrong",
        code: data.code,
      });
    }

    return data as T;
  }
}
