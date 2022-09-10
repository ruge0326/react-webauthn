import React from "react";
import "./App.css";

function App() {
  const [account, setAccount] = React.useState("");
  const submit = () => {
    console.log({ account });
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
