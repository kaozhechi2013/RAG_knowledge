import type { ApiServerConfig } from "@types";

import { loggerService } from "../services/LoggerService";
import { reduxService } from "../services/ReduxService";

const logger = loggerService.withContext("ApiServerConfig");

const defaultHost = "0.0.0.0"; // 允许局域网访问
const defaultPort = 23333;
const FIXED_API_KEY = "sk-knowledge-internal-2024"; // 固定的 API Key

class ConfigManager {
	private _config: ApiServerConfig | null = null;

	private generateApiKey(): string {
		// 优先使用环境变量，其次使用固定 Key
		return process.env.KNOWLEDGE_API_KEY || FIXED_API_KEY;
	}

	async load(): Promise<ApiServerConfig> {
		try {
			const settings = await reduxService.select("state.settings");
			const serverSettings = settings?.apiServer;
			// 始终使用固定的 API Key
			const apiKey = this.generateApiKey();

			// 更新到 Redux 以保持一致性
			if (serverSettings?.apiKey !== apiKey) {
				await reduxService.dispatch({
					type: "settings/setApiServerApiKey",
					payload: apiKey,
				});
			}
			this._config = {
				enabled: serverSettings?.enabled ?? false,
				port: serverSettings?.port ?? defaultPort,
				host: defaultHost,
				apiKey: apiKey,
			};
			return this._config;
		} catch (error: any) {
			logger.warn("Failed to load config from Redux, using defaults:", error);
			this._config = {
				enabled: false,
				port: defaultPort,
				host: defaultHost,
				apiKey: this.generateApiKey(),
			};
			return this._config;
		}
	}

	async get(): Promise<ApiServerConfig> {
		if (!this._config) {
			await this.load();
		}
		if (!this._config) {
			throw new Error("Failed to load API server configuration");
		}
		return this._config;
	}

	async reload(): Promise<ApiServerConfig> {
		return await this.load();
	}
}

export const config = new ConfigManager();
