import { loggerService } from "@main/services/LoggerService";
import { reduxService } from "@main/services/ReduxService";
import { type Request, type Response, Router } from "express";

const logger = loggerService.withContext("KnowledgeRoutes");
const router = Router();

/**
 * @swagger
 * /v1/knowledge:
 *   get:
 *     summary: Get all knowledge bases
 *     description: Get list of all available knowledge bases for web client selection
 *     tags: [Knowledge]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of knowledge bases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Knowledge base ID
 *                       name:
 *                         type: string
 *                         description: Knowledge base name
 *                       model:
 *                         type: object
 *                         description: Embedding model configuration
 *                       rerankModel:
 *                         type: object
 *                         description: Rerank model configuration
 *                       documentCount:
 *                         type: integer
 *                         description: Number of documents in the knowledge base
 *                       updated_at:
 *                         type: number
 *                         description: Last update timestamp
 *       500:
 *         description: Internal server error
 */
router.get("/", async (_req: Request, res: Response) => {
	try {
		// 直接获取knowledge.bases
		logger.info("开始获取知识库列表...");

		const knowledgeBases = await reduxService.select<any[]>(
			"state.knowledge.bases",
		);
		logger.info(`从Redux获取到 ${knowledgeBases?.length || 0} 个知识库`);

		if (!knowledgeBases || knowledgeBases.length === 0) {
			logger.warn("未找到任何知识库");
			return res.json({ data: [] });
		}

		logger.info(`第一个知识库:`, {
			id: knowledgeBases[0].id,
			name: knowledgeBases[0].name,
			itemsCount: knowledgeBases[0].items?.length,
		});

		// 转换为简化格式,适合前端展示
		const simplifiedBases = knowledgeBases.map((base) => ({
			id: base.id,
			name: base.name,
			model: base.model
				? {
						id: base.model.id,
						name: base.model.name,
						provider: base.model.provider,
					}
				: null,
			rerankModel: base.rerankModel
				? {
						id: base.rerankModel.id,
						name: base.rerankModel.name,
						provider: base.rerankModel.provider,
					}
				: null,
			dimensions: base.dimensions,
			documentCount: base.items?.length || 0,
			created_at: base.created_at,
			updated_at: base.updated_at,
			// 不返回完整的 items 数组,只返回数量
		}));

		logger.info(`返回 ${simplifiedBases.length} 个知识库`);

		res.json({
			data: simplifiedBases,
		});
	} catch (error) {
		logger.error("获取知识库列表失败:", error as Error);
		res.status(500).json({
			error: {
				message: "Failed to fetch knowledge bases",
				details: (error as Error).message,
			},
		});
	}
});

/**
 * @swagger
 * /v1/knowledge/{id}:
 *   get:
 *     summary: Get knowledge base details
 *     description: Get detailed information about a specific knowledge base including all items
 *     tags: [Knowledge]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Knowledge base ID
 *     responses:
 *       200:
 *         description: Knowledge base details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   description: Complete knowledge base object
 *       404:
 *         description: Knowledge base not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const knowledgeBases = await reduxService.select<any[]>(
			"state.knowledge.bases",
		);

		if (!knowledgeBases || knowledgeBases.length === 0) {
			return res.status(404).json({
				error: {
					message: "No knowledge bases found",
				},
			});
		}

		const base = knowledgeBases.find((kb) => kb.id === id);

		if (!base) {
			return res.status(404).json({
				error: {
					message: "Knowledge base not found",
					id,
				},
			});
		}

		logger.info(`返回知识库详情: ${base.name} (${id})`);

		return res.json({
			data: base,
		});
	} catch (error) {
		logger.error("获取知识库详情失败:", error as Error);
		return res.status(500).json({
			error: {
				message: "Failed to fetch knowledge base details",
				details: (error as Error).message,
			},
		});
	}
});

export { router as knowledgeRoutes };
