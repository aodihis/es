import { defineMiddlewares, authenticate } from "@medusajs/framework/http";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/dinar-wallets/*",
      middlewares: [authenticate("customer", ["bearer"])],
    },
    {
      matcher: "/store/dinar-payment/*",
      middlewares: [authenticate("customer", ["bearer"])],
    },
  ],
});
