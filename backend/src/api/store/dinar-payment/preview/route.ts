import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import DinarWalletsModuleService from "../../../../modules/dinar-wallets/service";
import { idrToDinar } from "../../../../modules/dinar-wallets/helper";
import { Modules } from "@medusajs/framework/utils";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import DinarWallets from "../../../../modules/dinar-wallets/models/dinar-wallets";
import { DINAR_WALLETS_MODULE } from "../../../../modules/dinar-wallets";

type PreviewBody = {
  cart_id: string;
};

export async function POST(
  req: AuthenticatedMedusaRequest<PreviewBody>,
  res: MedusaResponse,
) {
  const { cart_id } = req.body;

  if (!cart_id) {
    return res.status(400).json({ message: "Invalid cart id" });
  }

  const service: DinarWalletsModuleService =
    req.scope.resolve(DINAR_WALLETS_MODULE);
  const s = req.scope.resolve(Modules.CART);

  const auth_id = req.auth_context.actor_id;
  const balance = await service.getBalance(auth_id);

  const query = req.scope.resolve("query"); // or req.scope.resolve in API routes

  const {
    data: [cart],
  } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "discount_total",
      "discount_subtotal",
      "discount_tax_total",
      "original_total",
      "original_tax_total",
      "item_total",
      "item_subtotal",
      "item_tax_total",
      "original_item_total",
      "original_item_subtotal",
      "original_item_tax_total",
      "shipping_total",
      "shipping_subtotal",
      "shipping_tax_total",
      "original_shipping_tax_total",
      "original_shipping_subtotal",
      "original_shipping_total",
      "credit_line_subtotal",
      "credit_line_tax_total",
      "credit_line_total",
      "items.*",
      "shipping_methods.*",
    ],
    filters: {
      id: cart_id, // Specify the cart ID
    },
  });

  // @ts-ignore
  const total = cart.total;
  const dinarCost = idrToDinar(total);
  console.log(total);
  console.log(dinarCost);
  // console.log(total, dinarCost);
  if (!dinarCost) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  res.json({
    amount_idr: total,
    dinar_cost: dinarCost,
    balance,
    sufficient: balance >= dinarCost,
    rate: "1 DINAR = 15000 IDR",
  });
}
