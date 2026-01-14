import crypto from "crypto";

type GenerateDokuSignatureParams = {
  clientId: string;
  secretKey: string;
  requestId: string;
  timestamp: string; // ISO string
  requestTarget: string; // e.g. "/checkout/v1/payment"
  body?: unknown; // POST body (optional for GET)
  rawBody?: string;
};

interface DokuWebhookData {
  transaction: {
    status: "SUCCESS" | "FAILED" | "EXPIRED" | string;
    original_request_id: string;
  };
  order: {
    amount: number;
  };
}

export function generateDokuSignature({
  clientId,
  secretKey,
  requestId,
  timestamp,
  requestTarget,
  body,
  rawBody,
}: GenerateDokuSignatureParams): string {
  // Digest is required ONLY if body exists (POST / PUT)
  let digestLine = "";

  if (rawBody) {
    const digest = crypto
      .createHash("sha256")
      .update(rawBody, "utf8")
      .digest("base64");

    digestLine = `\nDigest:${digest}`;
  } else if (body !== undefined) {
    const bodyJson = JSON.stringify(body);

    const digest = crypto
      .createHash("sha256")
      .update(bodyJson, "utf8")
      .digest("base64");

    digestLine = `\nDigest:${digest}`;
  }

  const stringToSign =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${requestTarget}` +
    digestLine;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(stringToSign)
    .digest("base64");
  return `HMACSHA256=${signature}`;
}

export function isDokuWebhookData(data: unknown): data is DokuWebhookData {
  if (typeof data !== "object" || data === null) return false;

  const d = data as any;

  return (
    typeof d.transaction?.status === "string" &&
    typeof d.transaction?.original_request_id === "string" &&
    typeof d.order?.amount === "number"
  );
}

type DokuHeaders = Record<string, string | string[] | undefined>;

export function getHeader(headers: DokuHeaders, key: string): string {
  const value = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  if (!value) {
    throw new Error(`Missing required header: ${key}`);
  }
  return value;
}

export function verifyDokuSignature(params: {
  rawBody: string;
  headers: DokuHeaders;
  clientSecret: string;
}): void {
  const requestId = getHeader(params.headers, "Request-Id");
  const clientId = getHeader(params.headers, "Client-Id");
  const timestamp = getHeader(params.headers, "Request-Timestamp");
  const signature = getHeader(params.headers, "Signature");

  const payloadToSign = clientId + requestId + timestamp + params.rawBody;

  const expectedSignature = crypto
    .createHmac("sha256", params.clientSecret)
    .update(payloadToSign)
    .digest("base64");

  if (expectedSignature !== signature) {
    throw new Error("Invalid webhook signature");
  }
}
