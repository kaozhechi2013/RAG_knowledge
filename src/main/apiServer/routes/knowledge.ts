import KnowledgeService from "@main/services/KnowledgeService";
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

		// 转换为格式,包含items信息用于匹配文件名
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
			// 返回items数组用于文件名匹配（只包含必要的文件信息）
			items:
				base.items?.map((item: any) => ({
					id: item.id,
					type: item.type,
					content:
						item.type === "file" && item.content
							? {
									id: item.content.id,
									name: item.content.name,
									origin_name: item.content.origin_name,
									path: item.content.path,
									ext: item.content.ext,
								}
							: item.content,
				})) || [],
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

/**
 * @swagger
 * /v1/knowledge:
 *   post:
 *     summary: Create a new knowledge base
 *     description: Create a new knowledge base with specified configuration
 *     tags: [Knowledge]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - model
 *             properties:
 *               name:
 *                 type: string
 *                 description: Knowledge base name
 *               description:
 *                 type: string
 *                 description: Knowledge base description
 *               model:
 *                 type: object
 *                 description: Embedding model configuration
 *                 required:
 *                   - id
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   provider:
 *                     type: string
 *               rerankModel:
 *                 type: object
 *                 description: Rerank model configuration
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   provider:
 *                     type: string
 *     responses:
 *       200:
 *         description: Knowledge base created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req: Request, res: Response) => {
	try {
		const { name, description, model, rerankModel } = req.body;

		if (!name || !model) {
			return res.status(400).json({
				error: {
					message: "Missing required fields: name and model are required",
				},
			});
		}

		logger.info("创建知识库请求:", {
			name,
			model: model.id,
			rerankModel: rerankModel?.id,
		});

		// Create knowledge base params
		const baseParams = {
			id: `kb_${Date.now()}_${Math.random().toString(36).substring(7)}`,
			name,
			description: description || "",
			model,
			rerankModel: rerankModel || null,
			embedApiClient: model,
			rerankApiClient: rerankModel || null,
			dimensions: model.dimensions || 1024,
			documentCount: 30,
			created_at: Date.now(),
			updated_at: Date.now(),
			items: [],
		};

		// Call KnowledgeService to initialize RAG application
		await KnowledgeService.create(null as any, baseParams);

		logger.info("知识库创建成功:", {
			id: baseParams.id,
			name: baseParams.name,
		});

		return res.json({
			data: {
				id: baseParams.id,
				name: baseParams.name,
				model: baseParams.model,
				rerankModel: baseParams.rerankModel,
				created_at: baseParams.created_at,
			},
		});
	} catch (error) {
		logger.error("创建知识库失败:", error as Error);
		return res.status(500).json({
			error: {
				message: "Failed to create knowledge base",
				details: (error as Error).message,
			},
		});
	}
});

export { router as knowledgeRoutes };
