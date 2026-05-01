import "dotenv/config";
import app from "./src/app.js";
import { disconnectPrisma } from "./src/config/db.js";
import { closeBrowserPool } from "./src/utils/browserPool.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    await closeBrowserPool();
    await disconnectPrisma();
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
