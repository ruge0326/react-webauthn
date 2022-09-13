import {
  Action,
  AnyAction,
  PublicKey,
  SignedTransaction,
  Transaction,
} from "@greymass/eosio";
import { createPublic, createSignature } from "@greymass/webauthn";
import { eosCoreApi } from ".";
import { base64urlToBuffer } from "./utils";
import { parse as uuid_parse, v4 as uuidV4 } from "uuid";

export interface SignWithWebAuthNParams {
  public_key: string;
  cred_id: string;
  actions: AnyAction[];
}

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === "[::1]" ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export const signWithWebAuthn = async ({
  public_key,
  actions,
  cred_id,
}: SignWithWebAuthNParams) => {
  console.log("signWithWebAuthn", JSON.stringify(actions));

  const pubKey = PublicKey.from(public_key);

  const info = await eosCoreApi.get_info();
  const header = info.getTransactionHeader();

  const { abi } = await eosCoreApi.get_abi(actions[0].account);
  const noAbiErr = `No ABI for ${actions[0].account}`;
  if (!abi) throw new Error(noAbiErr);

  const transaction = Transaction.from({
    ...header,
    actions: actions.map((a) => Action.from(a, abi)),
  });

  const transactionDigest = transaction.signingDigest(info.chain_id);

  console.log("transactionDigest", transactionDigest);

  // sign
  // console.log('sign with ', cred_id, base64urlToBuffer(cred_id))
  // reponse is not define in Assertion type for some reason
  const assertion: any = await navigator.credentials.get({
    mediation: "required",
    publicKey: {
      timeout: 60000,
      // credentials we created before
      allowCredentials: [
        {
          id: base64urlToBuffer(cred_id),
          type: "public-key",
        },
      ],
      // the transaction you want to sign
      challenge: transactionDigest.array.buffer,
    },
  });

  console.log("assertion navigator.credentials", assertion);

  // await navigator.credentials.preventSilentAccess()

  console.log("preventSilentAccess");

  const signature = createSignature(pubKey!, assertion.response);
  const signedTransaction = SignedTransaction.from({
    ...transaction,
    signatures: [signature],
  });

  // const result = await eosCoreApi.push_transaction(signedTransaction)
  console.log("Signing WebAuthN result", signedTransaction);
  return signedTransaction;
};

export const createWebAuthNKey = async (account: string) => {
  const id = isLocalhost ? "localhost" : window.location.host;
  console.log(`createWebAuthNKey for ${account} : ${id}`);
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        // Your website domain name and display name
        // note that your website must be served over https or signatures will not be valid
        rp: { id, name: "100x App." },
        user: {
          // user.id must be unique for every request. Random bytes doesn't work,
          // though with uuid is allowing me to have multiple devices
          id: new Uint8Array(uuid_parse(uuidV4())),
          // username, usually the users account name but doesn't have to be
          name: account,
          // will be displayed when the user asks to sign
          displayName: account,
        },
        // don't change this, eosio will only work with -7 == EC2
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7,
          },
        ],
        timeout: 60000,
        // can be any bytes, more than 16 or some browser may complain
        challenge: new Uint8Array([
          0xbe, 0xef, 0xfa, 0xce, 0x22, 0xbe, 0xef, 0xfa, 0xce, 0xbe, 0xef,
          0xfa, 0xce, 0xbe, 0xef, 0xfa, 0xce, 0x22, 0xbe, 0xef, 0xfa, 0xce,
          0xbe, 0xef, 0xfa, 0xce,
        ]).buffer,
        attestation: "direct",
        authenticatorSelection: { authenticatorAttachment: "platform" },
      },
    })) as any; // For some reason Credential.response is not in Credential type.
    const eosioPublicKey = createPublic(cred.response);
    console.log("PUBKEY", {
      pubKey: eosioPublicKey.toString(),
      credRawId: cred.rawId,
      credId: cred.id,
    });
    return { pubKey: eosioPublicKey.toString(), credId: cred.id, error: false };
  } catch (error) {
    return { error };
  }
};
