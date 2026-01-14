import DinarWalletsModuleService from "./service";
import BigNumber from "bignumber.js";
import { BigNumberValue } from "@medusajs/framework/types";

export const toBigNumber = (value: any): BigNumber => {
  if (value?.bignumber_) {
    return value.bignumber_;
  }

  return new BigNumber(value);
};

export const idrToDinar = (idr: BigNumberValue): BigNumber => {
  return toBigNumber(idr)
    .dividedBy(DinarWalletsModuleService.IDR_TO_DINAR_RATE)
    .decimalPlaces(6, BigNumber.ROUND_DOWN);
};

export const dinarToIdr = (dinar: BigNumberValue): BigNumber => {
  return toBigNumber(dinar)
    .multipliedBy(DinarWalletsModuleService.IDR_TO_DINAR_RATE)
    .decimalPlaces(6, BigNumber.ROUND_DOWN);
};
