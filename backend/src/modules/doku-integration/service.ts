import {
  AbstractPaymentProvider,
  isString,
  PaymentActions,
} from "@medusajs/framework/utils";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
  RefundPaymentInput,
  RefundPaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
} from "@medusajs/framework/types";
import crypto from "crypto";
import {
  generateDokuSignature,
  getHeader,
  isDokuWebhookData,
  verifyDokuSignature,
} from "./helper";

type Options = {
  client_id: string;
  secret_key: string;
  is_production: boolean;
};

type InjectedDependencies = {};

class DokuPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "doku";

  protected config_: Options;

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options);
    this.config_ = options;
  }

  private getBaseUrl(): string {
    return this.config_.is_production
      ? "https://api.doku.com"
      : "https://api-sandbox.doku.com";
  }

  private generateRequestId(): string {
    return `${crypto.randomBytes(8).toString("hex")}`;
  }

  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input;
    try {
      // @ts-ignore
      const orderReference = `ORDER-${context.id || Date.now()}-${Date.now()}`;
      const requestId = context?.idempotency_key ?? this.generateRequestId();
      const timestamp = new Date().toISOString().slice(0, 19) + "Z";
      const path = "/checkout/v1/payment";

      const body = {
        order: {
          invoice_number: orderReference,
          amount,
        },
        payment: {
          payment_due_date: 60,
        },
      };

      const signature = generateDokuSignature({
        clientId: this.config_.client_id,
        secretKey: this.config_.secret_key,
        requestId,
        timestamp,
        requestTarget: path,
        body,
      });
      // Call DOKU API to create payment
      const response = await fetch(`${this.getBaseUrl()}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Id": this.config_.client_id,
          "Request-Id": requestId,
          "Request-Timestamp": timestamp,
          Signature: signature,
          "Content-Encoding": "br",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DOKU API Error: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const result_data = result.response;
      return {
        id: requestId,
        data: {
          id: requestId,
          order: result_data.order,
          payment_url: result_data.payment.url,
        },
      };
    } catch (error) {
      throw new Error(`Failed to initiate payment: ${error.message}`);
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput,
  ): Promise<AuthorizePaymentOutput> {
    return {
      status: PaymentActions.AUTHORIZED,
      data: input.data,
    };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // DOKU doesn't require explicit cancellation for pending payments
    // They expire automatically after due date
    return {
      data: {
        ...input.data,
        status: "canceled",
      },
    };
  }

  async capturePayment(
    input: CapturePaymentInput,
  ): Promise<CapturePaymentOutput> {
    const res = await this.getPaymentStatus(input);

    if (res.status === "captured") {
      return {
        data: {
          ...input.data,
        },
      };
    }
    throw new Error("Waiting for customer to pay.");
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    const externalId = input.data?.transaction_id;
    return {
      data: input.data,
    };
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<GetPaymentStatusOutput> {
    try {
      // @ts-ignore
      const requestId = input.data?.id;
      // @ts-ignore
      const orderId = input.data?.order.invoice_number;
      if (!requestId || !isString(requestId)) {
        throw Error("Invalid id");
      }
      const timestamp = new Date().toISOString().slice(0, 19) + "Z";
      const path = "/orders/v1/status/" + orderId;

      const signature = generateDokuSignature({
        clientId: this.config_.client_id,
        secretKey: this.config_.secret_key,
        requestId,
        timestamp,
        requestTarget: path,
      });
      // Call DOKU API to create payment
      const response = await fetch(`${this.getBaseUrl()}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Client-Id": this.config_.client_id,
          "Request-Id": requestId,
          "Request-Timestamp": timestamp,
          Signature: signature,
          "Content-Encoding": "br",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DOKU API Error: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const status = result.transaction.status;

      switch (status) {
        case "SUCCESS":
          return { status: "captured" };
        case "FAILED":
          return { status: "canceled" };
        case "TIMEOUT":
          return { status: "canceled" };
        default:
          return { status: "pending" };
      }
    } catch (error) {
      throw new Error(`Failed to initiate payment: ${error.message}`);
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    const { data, rawData, headers } = payload;
    if (!rawData) {
      throw new Error("Missing raw request body");
    }

    const requestId = headers["request-id"] as string;
    const clientId = headers["client-id"] as string;
    const timestamp = headers["request-timestamp"] as string;
    const signature = headers["signature"] as string;
    const path = "/hooks/payment/doku_doku";
    const expectedSignature = generateDokuSignature({
      clientId,
      secretKey: this.config_.secret_key,
      requestId,
      timestamp,
      requestTarget: path,
      body: data,
      rawBody: rawData as string,
    });

    if (signature != expectedSignature) {
      throw Error("Invalid Signature");
    }

    if (!isDokuWebhookData(data)) {
      throw new Error("Invalid DOKU webhook payload");
    }

    const status = data.transaction.status;
    const sessionId = data.transaction.original_request_id;
    const amount = data.order.amount;
    switch (status) {
      case "SUCCESS":
        return {
          action: PaymentActions.SUCCESSFUL,
          data: {
            session_id: sessionId,
            amount,
          },
        };

      case "FAILED":
      case "EXPIRED":
        return {
          action: "failed",
          data: {
            session_id: sessionId,
            amount,
          },
        };

      default:
        return {
          action: "failed",
        };
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new Error("Not supported");
  }

  async retrievePayment(
    input: RetrievePaymentInput,
  ): Promise<RetrievePaymentOutput> {
    return {};
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const { amount, currency_code, context } = input;

    // Validate context.customer
    if (!context || !context.customer) {
      throw new Error("Context must include a valid customer");
    }

    const externalId = input.data?.transaction_id;

    // For DOKU, we might need to cancel old payment and create new one
    // if amount changes significantly
    return {
      ...input.data,
    };
  }
}

export default DokuPaymentProviderService;
