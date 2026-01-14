import DinarWalletsModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const DINAR_WALLETS_MODULE = "dinar_wallets";

export default Module(DINAR_WALLETS_MODULE, {
  service: DinarWalletsModuleService,
});
