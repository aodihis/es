import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import DinarWalletsModuleService from "../../../../modules/dinar-wallets/service";
import { DINAR_WALLETS_MODULE } from "../../../../modules/dinar-wallets";

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const service: DinarWalletsModuleService =
    req.scope.resolve(DINAR_WALLETS_MODULE);
  const actor_id = req.auth_context.actor_id;
  const balance = await service.getBalance(actor_id);
  res.json({ balance });
}
