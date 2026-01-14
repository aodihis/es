import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { Context, BigNumberValue, DAL } from "@medusajs/framework/types";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import BigNumber from "bignumber.js";

interface InjectedDependencies {
  baseRepository: DAL.RepositoryService;
}

class DinarWalletsModuleService {
  static IDR_TO_DINAR_RATE = "8000000"; // keep as string

  protected baseRepository_: DAL.RepositoryService;

  constructor({ baseRepository }: InjectedDependencies) {
    this.baseRepository_ = baseRepository;
  }

  /* ---------------------------------------------
   * READ BALANCE
   * --------------------------------------------- */
  @InjectManager()
  async getBalance(
    actor_id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<BigNumberValue> {
    const result = await sharedContext?.manager?.execute(
      `SELECT balance FROM dinar_wallets WHERE actor_id = ?`,
      [actor_id],
    );
    if (result && result.length > 0) {
      return result[0].balance;
    }
    return "0";
  }

  /* ---------------------------------------------
   * INTERNAL: INCREASE (TRANSACTION)
   * --------------------------------------------- */
  @InjectTransactionManager()
  protected async increase_balance_(
    input: {
      actor_id: string;
      add: BigNumberValue;
    },
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<BigNumberValue> {
    const manager = sharedContext!.transactionManager;

    const rows = await manager!.execute(
      `SELECT balance FROM dinar_wallets WHERE actor_id = ? FOR UPDATE`,
      [input.actor_id],
    );

    const add = new BigNumber(input.add.toString());

    if (!rows.length) {
      const newBalance = add.decimalPlaces(6, BigNumber.ROUND_DOWN);
      console.log(input.actor_id);
      await manager!.execute(
        `INSERT INTO dinar_wallets (actor_id, balance) VALUES (?, ?)`,
        [input.actor_id, newBalance.toString()],
      );

      return newBalance.toString();
    }

    const current = new BigNumber(rows[0].balance);
    const newBalance = current.plus(add).decimalPlaces(6, BigNumber.ROUND_DOWN);

    await manager!.execute(
      `UPDATE dinar_wallets SET balance = ? WHERE actor_id = ?`,
      [newBalance.toString(), input.actor_id],
    );

    return newBalance.toString();
  }

  /* ---------------------------------------------
   * INTERNAL: DECREASE (TRANSACTION)
   * --------------------------------------------- */
  @InjectTransactionManager()
  protected async decrease_balance_(
    input: {
      actor_id: string;
      decrement: BigNumberValue;
    },
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<BigNumberValue> {
    const manager = sharedContext!.transactionManager;

    const rows = await manager!.execute(
      `SELECT balance FROM dinar_wallets WHERE actor_id = ? FOR UPDATE`,
      [input.actor_id],
    );

    if (!rows.length) {
      throw new Error("Wallet not found");
    }

    const current = new BigNumber(rows[0].balance);
    const decrement = new BigNumber(input.decrement.toString());

    if (current.isLessThan(decrement)) {
      throw new Error("Insufficient Dinar balance");
    }

    const newBalance = current
      .minus(decrement)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    await manager!.execute(
      `UPDATE dinar_wallets SET balance = ? WHERE actor_id = ?`,
      [newBalance.toString(), input.actor_id],
    );

    return newBalance.toString();
  }

  /* ---------------------------------------------
   * PUBLIC: TOP UP
   * --------------------------------------------- */
  @InjectManager()
  async increase_balance(
    input: {
      actor_id: string;
      add: BigNumberValue;
    },
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<BigNumberValue> {
    return this.increase_balance_(input, sharedContext);
  }

  /* ---------------------------------------------
   * PUBLIC: PAY / DECREMENT
   * --------------------------------------------- */
  @InjectManager()
  async decrease_balance(
    input: {
      actor_id: string;
      decrement: BigNumberValue;
    },
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<BigNumberValue> {
    return this.decrease_balance_(input, sharedContext);
  }
}

export default DinarWalletsModuleService;
