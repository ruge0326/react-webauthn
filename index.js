const express = require("express"),
  bodyParser = require("body-parser"),
  cookieSession = require("cookie-session"),
  path = require("path"),
  crypto = require("crypto"),
  app = express();

const cors = require("cors");
const localtunnel = require("localtunnel");

const config = {
  port: process.env.PORT || 5500,
  origin: "https://swt-bank.loca.lt", // demo
  rpId: "swt-bank.loca.lt", // demo
  rpName: "Webauthn",
  mode: "development",
  baseUrl: undefined, // Uses origin as default
  cookieMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  challengeTimeoutMs: 90 * 1000, // 90 seconds
  loginTokenExpireSeconds: 60,
};

const port = config.port;

app.use(bodyParser.json());

app.use(
  cors({
    origin: `http://localhost:${port}`,
    credentials: true,
  })
);

// Sessions
app.use(
  cookieSession({
    name: "session",
    keys: [crypto.randomBytes(32).toString("hex")],
    //keys: database.getData("/keys"),
    // Cookie Options
    maxAge: config.cookieMaxAge,
  })
);

app.use(express.static(path.join(__dirname, "build")));

app.listen(port, async () => {
  const tunnel = await localtunnel({ port: port, subdomain: "swt-bank" });
  console.log("Server listening on http://localhost:" + port);
  console.log("Tunnel:https://" + tunnel.clientId + ".loca.lt");
  tunnel.on("close", () => {
    console.log("Tunnel closed");
  });
  process.on("exit", () => {
    tunnel.close();
  });
});

console.log(`Started app on port ${port}`);

module.exports = app;
