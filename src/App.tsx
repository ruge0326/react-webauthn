import React from "react";
import "./App.css";
import { createWebAuthNKey } from "./eosio/webauthn";
import { pushTransactionWebAuthN } from "./eosio";

const checkAccountExt = (account: string) =>
  account.split(".").length === 1 && account.length < 12
    ? `${account}.bk`
    : account;

const referrer = "lefirst";
const deviceName = `demo device ${new Date().getTime()}`;

function App() {
  const [account, setAccount] = React.useState("");
  const [keyConfig, setKeyConfig] = React.useState({
    account: "",
    referrer: "",
    cred_id: "",
    public_key: "",
    device_name: "",
  });

  const pushTransaction = async (transaction: any) => {
    console.log("pushTransaction", JSON.stringify(transaction));

    try {
      let response: any;

      console.info("Attempting to sign with WebAuthn");

      response = await pushTransactionWebAuthN({
        actions: transaction.actions,
        public_key: keyConfig.public_key,
        cred_id: keyConfig.cred_id,
      });

      const transaction_id =
        response?.transaction?.id.toString() || response.transaction_id;
      console.log("pushTransaction id", transaction_id);
      console.info("pushTransaction response", response);
    } catch (error) {
      console.log("pushTransaction error", error);
    }
  };

  const faucetCall = async (quantity: string) => {
    try {
      const transaction = {
        actions: [
          {
            account: "bkbmocktoken",
            name: "issue",
            authorization: [
              {
                actor: account,
                permission: "active",
              },
            ],
            data: {
              to: account,
              quantity,
              memo: `${quantity} for 100x testing`,
            },
          },
        ],
      };
      console.log("transaction", transaction);
      await pushTransaction(transaction);
    } catch (err) {
      console.log("faucetCall error", err);
    }
  };

  const submit = async () => {
    console.log({ account });
    const formatted_account = checkAccountExt(account);
    console.log({ formatted_account, partyId: window.location.host });
    const { pubKey, credId, error } = await createWebAuthNKey(
      formatted_account
    );
    console.log({ pubKey, credId, error });
    if (!error && pubKey && credId) {
      console.log({
        account: formatted_account,
        referrer,
        cred_id: credId,
        public_key: pubKey,
        device_name: deviceName,
      });
      setKeyConfig({
        account: formatted_account,
        referrer,
        cred_id: credId,
        public_key: pubKey,
        device_name: deviceName,
      });
    }
  };

  React.useEffect(() => {
    console.log({ keyConfig });
  }, [keyConfig]);

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
            {account && keyConfig.public_key && (
              <div>
                <div>Account: {account}</div>
                <div>public_key: {keyConfig.public_key}</div>
              </div>
            )}
          </div>
          {keyConfig.public_key && (
            <div>
              <h1>Push Tx: {deviceName}</h1>
              <input
                type="button"
                value="Push"
                onClick={() => {
                  faucetCall("1000.0000 USDT");
                }}
              />
              <br></br>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
