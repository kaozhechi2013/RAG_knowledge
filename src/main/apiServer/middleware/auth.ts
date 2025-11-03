import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

import { config } from "../config";

/**
 * 认证中间件 - API Key 验证
 *
 * 验证请求中的 Bearer Token 或 x-api-key 是否与服务器配置的 API Key 匹配
 */
export const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const auth = req.header("Authorization") || "";
	const xApiKey = req.header("x-api-key") || "";

	// 如果没有提供任何凭证
	if (!auth && !xApiKey) {
		return res.status(401).json({ error: "Unauthorized: missing credentials" });
	}

	let token: string | undefined;

	// 优先使用 Bearer Token
	if (auth) {
		const trimmed = auth.trim();
		const bearerPrefix = /^Bearer\s+/i;
		if (bearerPrefix.test(trimmed)) {
			const candidate = trimmed.replace(bearerPrefix, "").trim();
			if (!candidate) {
				return res
					.status(401)
					.json({ error: "Unauthorized: empty bearer token" });
			}
			token = candidate;
		}
	}

	// 回退到 x-api-key
	if (!token && xApiKey) {
		if (!xApiKey.trim()) {
			return res.status(401).json({ error: "Unauthorized: empty x-api-key" });
		}
		token = xApiKey.trim();
	}

	if (!token) {
		return res
			.status(401)
			.json({ error: "Unauthorized: invalid credentials format" });
	}

	const { apiKey } = await config.get();

	if (!apiKey) {
		return res.status(403).json({ error: "Forbidden" });
	}

	// 时间安全比较，防止时序攻击
	if (token.length !== apiKey.length) {
		return res.status(403).json({ error: "Forbidden" });
	}

	const tokenBuf = Buffer.from(token);
	const keyBuf = Buffer.from(apiKey);
	if (!crypto.timingSafeEqual(tokenBuf, keyBuf)) {
		return res.status(403).json({ error: "Forbidden" });
	}

	return next();
};
