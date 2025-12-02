// 纯 Node.js 模式启动 API 服务器（不启动 Electron）
import "./bootstrap.js";
import "@main/config";
import { apiServer } from "./apiServer/server.js";
import { loggerService } from "./services/LoggerService.js";

const logger = loggerService.withContext("ServerMode");

async function startServerMode() {
	try {
		logger.info("Starting RAG Knowledge in Server Mode...");

		// 只启动 API 服务器
		await apiServer.start();

		logger.info("======================================");
		logger.info("RAG Knowledge Server Mode is running");
		logger.info("Users can access via web client");
		logger.info("Press Ctrl+C to stop");
		logger.info("======================================");
	} catch (error) {
		logger.error("Failed to start server mode:", error);
		process.exit(1);
	}
}

// 处理退出信号
process.on("SIGINT", async () => {
	logger.info("Shutting down...");
	await apiServer.stop();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	logger.info("Shutting down...");
	await apiServer.stop();
	process.exit(0);
});

startServerMode();
