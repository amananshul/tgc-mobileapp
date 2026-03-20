import env from "./config/env";
import app from "./app";

app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port} [${env.nodeEnv}]`);
});
