import React from "react";
import { parse as uuid_parse, v4 as uuidV4 } from "uuid";
import { createPublic, createSignature } from "@greymass/webauthn";
import "./App.css";

const checkAccountExt = (account: string) =>
  account.split(".").length === 1 && account.length < 12
    ? `${account}.bk`
    : account;

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === "[::1]" ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);
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
        attestation: "none",
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

function App() {
  const [account, setAccount] = React.useState("");

  const submit = async () => {
    console.log({ account });
    const formatted_account = checkAccountExt(account);

    console.log({ formatted_account, partyId: window.location.host });
    const { pubKey, credId, error } = await createWebAuthNKey(
      formatted_account
    );
    console.log({ pubKey, credId, error });
    //   if (!error && pubKey && credId) {
    //     const res = await requestNewAccount({
    //       variables: {
    //         account_data: {
    //           account: formatted_account,
    //           referrer: checkAccountExt(referrer as string),
    //           cred_id: credId,
    //           public_key: pubKey,
    //           device_name: deviceName,
    //         },
    //       },
    //     })
    //     setLoading(false)
    //     console.log('registring account response', res)
    //     history.push('/register-account/success')
    //   } else {
    //     setLoading(false)
    //   }
    //   console.log('webauthn credentials', { pubKey, credId })
    // })
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h1>Webauthn</h1>

          {/* <form onSubmit={submit}>
            <input>New account</input>
            <input type="submit">Create</input>
          </form> */}
          <div>
            <form>
              <label htmlFor="account">Account</label>
              <br></br>
              <input
                type="text"
                id="account"
                value={account}
                onChange={(event) => {
                  setAccount(event.target.value);
                }}
              />
              <br></br>
              <input type="button" value="Create Account" onClick={submit} />
            </form>
            <br></br>
            {account && <div>Account: {account}</div>}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
