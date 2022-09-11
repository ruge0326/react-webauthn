// TODO: Reemplace with @greymass/eosio
import { Asset, Sym, asset } from "eos-common";
import np from "number-precision";

export type TokenData = {
  symbol_code: string;
  token_symbol: Sym;
  token_contract: string;
  fiat_symbol: string;
  delphi_usd_scope: string;
  exchange_fee: Number;
  withdrawal_fee: Asset;
  loan_fee: Number;
  paused_trading: Boolean;
  paused_leverage: Boolean;
  allowed_withdrawal: Boolean;
};

export const base64urlToBuffer = (baseurl64String: string) => {
  // Base64url to Base64
  const padding = "==".slice(0, (4 - (baseurl64String.length % 4)) % 4);
  const base64String =
    baseurl64String.replace(/-/g, "+").replace(/_/g, "/") + padding;

  // Base64 to binary string
  const str = atob(base64String);

  // Binary string to buffer
  const buffer = new ArrayBuffer(str.length);
  const byteView = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) {
    byteView[i] = str.charCodeAt(i);
  }
  return buffer;
};

// TODO: remove eos-common
export const stringToAsset = (str: string, token: TokenData) => {
  return asset(
    np.times(parseFloat(str), Math.pow(10, token.token_symbol.precision())),
    token.token_symbol
  );
};
