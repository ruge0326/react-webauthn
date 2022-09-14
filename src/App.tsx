import React from "react";
import "./App.css";
import { createWebAuthNKey } from "./eosio/webauthn";
import { pushTransactionWebAuthN } from "./eosio";
import { CopyToClipboard } from "react-copy-to-clipboard";

const checkAccountExt = (account: string) =>
  account.split(".").length === 1 && account.length < 12
    ? `${account}.bk`
    : account;

const referrer = "lefirst";
const deviceName = `demo device ${new Date().getTime()}`;

function App() {
  const ref = React.useRef<HTMLButtonElement | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [account, setAccount] = React.useState(
    localStorage.getItem("100x_account") || ""
  );
  const [last_tx_id, setLastTxId] = React.useState(
    localStorage.getItem("last_tx_id") || ""
  );
  const [keyConfig, setKeyConfig] = React.useState({
    account: localStorage.getItem("100x_account") || "",
    referrer: localStorage.getItem("100x_referrer") || "",
    cred_id: localStorage.getItem("100x_cred_id") || "",
    public_key: localStorage.getItem("100x_public_key") || "",
    device_name: localStorage.getItem("100x_device_name") || "",
  });

  const pushTransaction = async (transaction: any) => {
    console.log("pushTransaction", JSON.stringify(transaction));

    // const x_referrer = localStorage.getItem("100x_referrer") || "";
    const x_credId = localStorage.getItem("100x_cred_id") || "";
    const x_pubKey = localStorage.getItem("100x_public_key") || "";
    // const x_deviceName = localStorage.getItem("100x_device_name") || "";

    try {
      let response: any;

      console.info("Attempting to sign with WebAuthn", {
        actions: transaction.actions,
        public_key: x_pubKey,
        cred_id: x_credId,
      });

      response = await pushTransactionWebAuthN({
        actions: transaction.actions,
        public_key: x_pubKey,
        cred_id: x_credId,
      });

      const transaction_id =
        response?.transaction?.id.toString() || response.transaction_id;
      console.log("pushTransaction id", transaction_id);
      console.info("pushTransaction response", response);
      alert(transaction_id);
      setLastTxId(transaction_id);
      localStorage.setItem("last_tx_id", transaction_id);
    } catch (error) {
      console.log("pushTransaction error", error);
    }
  };

  const faucetCall = React.useCallback(async (quantity: string) => {
    setProcessing(true);
    const formatted_account = localStorage.getItem("100x_account") || "";
    try {
      const transaction = {
        actions: [
          {
            account: "bkbmocktoken",
            name: "issue",
            authorization: [
              {
                actor: formatted_account,
                permission: "active",
              },
            ],
            data: {
              to: formatted_account,
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
    } finally {
      setTimeout(() => {
        setProcessing(false);
      }, 3000);
    }
  }, []);

  const submit = async () => {
    const formatted_account = localStorage.getItem("100x_account") || "";
    console.log({ formatted_account });
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

      localStorage.setItem("100x_referrer", referrer);
      localStorage.setItem("100x_cred_id", credId);
      localStorage.setItem("100x_public_key", pubKey);
      localStorage.setItem("100x_device_name", deviceName);

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

  React.useEffect(() => {
    const push_button = ref.current;
    if (push_button && push_button.getAttribute("listener") !== "true") {
      push_button.addEventListener("click", (e) => {
        console.log("yupiiiiii init");
        faucetCall("1000.0000 USDT");
        console.log("yupiiiiii finish");
      });
      push_button.setAttribute("listener", "true");
      console.log("event has been attached");
    }
  }, [ref, faucetCall]);

  const disabled_push_tx =
    !keyConfig.cred_id ||
    !keyConfig.public_key ||
    !keyConfig.account ||
    !keyConfig.device_name ||
    processing;

  const clearStore = () => {
    localStorage.setItem("100x_referrer", "");
    localStorage.setItem("100x_cred_id", "");
    localStorage.setItem("100x_public_key", "");
    localStorage.setItem("100x_device_name", "");
    localStorage.setItem("100x_account", "");
    setAccount("");
    setKeyConfig({
      account: "",
      referrer: "",
      cred_id: "",
      public_key: "",
      device_name: "",
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <p>Webauthn build: 0.1.2 </p>
          <p>Current account: {checkAccountExt(account)} </p>

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
                  const formatted_account = checkAccountExt(
                    (event.target.value || "").toLowerCase()
                  );
                  localStorage.setItem("100x_account", formatted_account);
                  setAccount(formatted_account);
                }}
              />
              <br></br>
              <input type="button" value="Create Account" onClick={submit} />
              <input
                type="button"
                value="Clear localstorage"
                onClick={clearStore}
              />
            </form>
            <br></br>
          </div>
          <br></br>
          {last_tx_id && (
            <CopyToClipboard text={last_tx_id} onCopy={() => {}}>
              <button>Copy last_tx_id</button>
            </CopyToClipboard>
          )}
          <br></br>
          {keyConfig.public_key && (
            <div>
              <br></br>
              <CopyToClipboard text={keyConfig.cred_id} onCopy={() => {}}>
                <button>Copy cred_id</button>
              </CopyToClipboard>
              <br></br>
              <CopyToClipboard text={keyConfig.public_key} onCopy={() => {}}>
                <button>Copy public_key</button>
              </CopyToClipboard>
              <br></br>
              <CopyToClipboard text={keyConfig.account} onCopy={() => {}}>
                <button>Copy account</button>
              </CopyToClipboard>
              <br></br>
              <CopyToClipboard text={keyConfig.device_name} onCopy={() => {}}>
                <button>Copy device_name</button>
              </CopyToClipboard>
              <br></br>
            </div>
          )}
          <button
            ref={ref}
            type="button"
            value="Push"
            id="faucet"
            disabled={disabled_push_tx}
          >
            PUSH gesture - WAIT for Approval
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
