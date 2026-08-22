import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";
import fs from "fs";

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled rejection: ${err.message}`);
  process.exit(1);
});

start();
