import { createApp } from "./app.js";
import { appEnv } from "./config/env.js";

const app = createApp();

app.listen(appEnv.APP_PORT, () => {
  console.log(`backend listening on http://localhost:${appEnv.APP_PORT}`);
});