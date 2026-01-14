import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import DinarWalletsModuleService from "../../../../modules/dinar-wallets/service";
import { idrToDinar } from "../../../../modules/dinar-wallets/helper";
import { Modules } from "@medusajs/framework/utils";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";

type Body = {
  cart_id: string;
  pin: string;
};

export async function POST(
  req: AuthenticatedMedusaRequest<Body>,
  res: MedusaResponse,
) {
  const { cart_id, pin } = req.body;

  if (pin !== "123456") {
    res.status(400).json({ message: "Invalid Pin" });
  }

  // const container = req.scope;

  // const cartService = container.resolve(Modules.CART);
  // const paymentModule = container.resolve(Modules.PAYMENT);

  // const paymentCollections = await paymentModule.listPaymentCollections(
  //   { cart_id },
  //   { relations: ["payment_sessions"] },
  // );

  // cart.payment_collection.id;

  res.status(200).json({ message: "Success" });
}
