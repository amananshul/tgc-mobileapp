const env = require("./src/config/env");
const app = require("./src/app");

app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port} [${env.nodeEnv}]`);
});
