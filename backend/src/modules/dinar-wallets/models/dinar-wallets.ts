import { model } from "@medusajs/framework/utils";

const DinarWallets = model.define("dinar_wallets", {
  actor_id: model.id().primaryKey(),
  balance: model.float(),
});

export default DinarWallets;
