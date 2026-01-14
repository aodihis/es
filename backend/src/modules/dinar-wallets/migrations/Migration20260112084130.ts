import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260112084130 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "dinar_wallets" ("actor_id" text not null, "balance" real not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dinar_wallets_pkey" primary key ("actor_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dinar_wallets_deleted_at" ON "dinar_wallets" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "dinar_wallets" cascade;`);
  }

}
