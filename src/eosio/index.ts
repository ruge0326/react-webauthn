import { APIClient } from "@greymass/eosio";
import { config } from "../config";
import { signWithWebAuthn, SignWithWebAuthNParams } from "./webauthn";

export const eosCoreApi = new APIClient({ url: config.services.chainRpc }).v1
  .chain;

export const pushTransactionWebAuthN = async ({
  public_key,
  actions,
  cred_id,
}: SignWithWebAuthNParams) => {
  console.info("pushTransactionWebAuthN", { public_key, actions, cred_id });

  const signedTransactionWebAuthN = await signWithWebAuthn({
    public_key,
    actions,
    cred_id,
  });

  const response = await eosCoreApi.push_transaction(signedTransactionWebAuthN);

  console.log(
    "pushTransactionWebAuthN transaction_id",
    response.transaction_id
  );

  return response;
};
