import { AbstractPaymentProvider } from "@medusajs/framework/utils";
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

type Options = {};

type InjectedDependencies = {};

class DinarPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "dinar-payment";

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options);
  }
  async authorizePayment(
    input: AuthorizePaymentInput,
  ): Promise<AuthorizePaymentOutput> {
    return {
      data: input.data,
      status: "authorized",
    };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: {} };
  }

  async capturePayment(
    input: CapturePaymentInput,
  ): Promise<CapturePaymentOutput> {
    return {
      data: {},
    };
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    const externalId = input.data?.id;

    return {
      data: input.data,
    };
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<GetPaymentStatusOutput> {
    const status = "success";

    return { status: "captured" };
    // switch (status) {
    //   case "requires_capture":
    //     return { status: "authorized" };
    //   case "success":
    //     return { status: "captured" };
    //   case "canceled":
    //     return { status: "canceled" };
    //   default:
    //     return { status: "pending" };
    // }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    return {
      action: "not_supported",
    };
  }
  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context: customerDetails } = input;

    return {
      id: "",
      data: {},
    };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const externalId = input.data?.id;

    return {
      data: input.data,
    };
  }

  async retrievePayment(
    input: RetrievePaymentInput,
  ): Promise<RetrievePaymentOutput> {
    const externalId = input.data?.id;
    return {};
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const { amount, currency_code, context } = input;
    const externalId = input.data?.id;

    // Validate context.customer
    if (!context || !context.customer) {
      throw new Error("Context must include a valid customer.");
    }

    return {};
  }
}

export default DinarPaymentProviderService;
