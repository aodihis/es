import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import DinarWalletsModuleService from "../../../../modules/dinar-wallets/service";
import { DINAR_WALLETS_MODULE } from "../../../../modules/dinar-wallets";

type TopUpBody = {
  amount: number;
};

export async function POST(
  req: AuthenticatedMedusaRequest<TopUpBody>,
  res: MedusaResponse,
) {
  const { amount } = req.body;
  const service: DinarWalletsModuleService =
    req.scope.resolve(DINAR_WALLETS_MODULE);
  const actor_id = req.auth_context.actor_id;
  const balance = await service.increase_balance({
    actor_id,
    add: amount,
  });
  res.json({ balance });
}
