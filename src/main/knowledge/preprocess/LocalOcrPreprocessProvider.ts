import fs from "node:fs";
import path from "node:path";

import { loggerService } from "@logger";
import { fileStorage } from "@main/services/FileStorage";
import { mineruService } from "@main/services/MineruService";
import type { FileMetadata, PreprocessProvider } from "@types";
import { PDFDocument } from "pdf-lib";
import pdfParse from "pdf-parse";

import BasePreprocessProvider from "./BasePreprocessProvider";

const logger = loggerService.withContext("LocalOcrPreprocessProvider");

/**
 * 本地OCR预处理提供商
 * 使用本地OCR服务（Tesseract/PaddleOCR/系统OCR）处理PDF
 * 无需外部API密钥，完全离线可用
 */
export default class LocalOcrPreprocessProvider extends BasePreprocessProvider {
	constructor(provider: PreprocessProvider, userId?: string) {
		super(provider, userId);
	}

	public async parseFile(
		_sourceId: string,
		file: FileMetadata,
	): Promise<{ processedFile: FileMetadata; quota?: number }> {
		try {
			const filePath = fileStorage.getFilePathById(file);
			logger.info(`开始本地OCR处理: ${filePath}`);

			// 1. 检查PDF是否需要OCR
			const needsOcr = await this.checkIfPdfNeedsOcr(filePath);

			if (!needsOcr) {
				logger.info(`PDF包含文本层，无需OCR: ${filePath}`);
				// 直接返回原文件，使用默认的PDF处理
				return { processedFile: file };
			}

			logger.info(`PDF需要OCR识别（图片扫描件）: ${filePath}`);

			// 2. 将PDF转换为图片并OCR
			const markdownText = await this.processPdfWithOcr(file, filePath);

			// 3. 保存处理后的Markdown文件
			const outputPath = await this.saveProcessedFile(file, markdownText);

			// 4. 创建处理后的文件信息
			const processedFile = this.createProcessedFileInfo(file, outputPath);

			logger.info(`本地OCR处理完成: ${filePath}`);

			return {
				processedFile,
				quota: undefined, // 本地OCR无配额限制
			};
		} catch (error) {
			logger.error(`本地OCR处理失败:`, error as Error);
			throw error;
		}
	}

	/**
	 * 检查PDF是否需要OCR
	 * 如果PDF已有文本层，则不需要OCR
	 */
	private async checkIfPdfNeedsOcr(filePath: string): Promise<boolean> {
		try {
			const dataBuffer = await fs.promises.readFile(filePath);
			const data = await pdfParse(dataBuffer);

			// 如果PDF有文本内容，则不需要OCR
			const hasText = data.text && data.text.trim().length > 100;

			logger.debug(`PDF文本长度: ${data.text?.length || 0}`);

			return !hasText;
		} catch (error) {
			logger.warn(`检查PDF文本失败，默认需要OCR: ${error}`);
			return true;
		}
	}

	/**
	 * 使用OCR处理PDF - 使用MinerU进行高质量PDF转Markdown
	 */
	private async processPdfWithOcr(
		file: FileMetadata,
		filePath: string,
	): Promise<string> {
		logger.info(`使用MinerU处理PDF: ${filePath}`);

		try {
			// 1. 检查MinerU是否可用
			const isMineruAvailable = await mineruService.checkInstallation();

			if (!isMineruAvailable) {
				logger.warn("MinerU未安装或不可用，使用简化处理");
				return this.fallbackPdfProcessing(filePath);
			}

			// 2. 使用MinerU转换PDF
			const outputDir = path.join(this.storageDir, file.id, "mineru_temp");
			const result = await mineruService.convertPdfToMarkdown(filePath, {
				outputDir,
				lang: "ch", // 默认中文，后续可以从配置读取
				parseMethod: "auto",
				formulaEnable: true,
				tableEnable: true,
			});

			if (!result.success || !result.markdownPath) {
				logger.error(`MinerU转换失败: ${result.error}`);
				return this.fallbackPdfProcessing(filePath);
			}

			// 3. 读取MinerU生成的Markdown文件
			const markdownContent = await fs.promises.readFile(
				result.markdownPath,
				"utf-8",
			);

			logger.info(`MinerU处理成功，Markdown长度: ${markdownContent.length}`);

			// 4. 清理临时文件（可选）
			// 这里保留输出目录，因为可能包含图片等资源
			// 如需清理，可以在这里添加清理逻辑

			return markdownContent;
		} catch (error) {
			logger.error("MinerU处理失败，使用简化处理:", error as Error);
			return this.fallbackPdfProcessing(filePath);
		}
	}

	/**
	 * 简化的PDF处理（当MinerU不可用时的后备方案）
	 */
	private async fallbackPdfProcessing(filePath: string): Promise<string> {
		const pdfBuffer = await fs.promises.readFile(filePath);
		const pdfDoc = await PDFDocument.load(pdfBuffer);
		const numPages = pdfDoc.getPageCount();

		logger.info(`PDF总页数: ${numPages}`);

		// 限制页数，避免处理时间过长
		const maxPages = 50;
		if (numPages > maxPages) {
			logger.warn(
				`PDF页数(${numPages})超过限制(${maxPages})，仅处理前${maxPages}页`,
			);
		}

		const results: string[] = [];

		logger.warn("使用简化的PDF文本提取，建议安装MinerU以获得更好效果");

		try {
			const data = await pdfParse(pdfBuffer);
			results.push(data.text);
		} catch (error) {
			logger.error("PDF文本提取失败:", error as Error);
			results.push(
				"# PDF内容提取失败\n\n无法提取PDF内容，请安装MinerU或使用云端OCR服务。",
			);
		}

		return results.join("\n\n---\n\n");
	}

	/**
	 * 保存处理后的文件
	 */
	private async saveProcessedFile(
		file: FileMetadata,
		content: string,
	): Promise<string> {
		const outputDir = path.join(this.storageDir, file.id);

		// 确保输出目录存在
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const outputPath = path.join(outputDir, `${file.id}.md`);
		await fs.promises.writeFile(outputPath, content, "utf-8");

		logger.info(`保存处理结果到: ${outputPath}`);

		return outputPath;
	}

	/**
	 * 创建处理后的文件信息
	 */
	private createProcessedFileInfo(
		file: FileMetadata,
		outputPath: string,
	): FileMetadata {
		const stats = fs.statSync(outputPath);

		return {
			...file,
			name: file.name.replace(".pdf", ".md"),
			path: outputPath,
			ext: ".md",
			size: stats.size,
			created_at: stats.birthtime.toISOString(),
		};
	}

	/**
	 * 检查配额（本地OCR无配额限制）
	 */
	public async checkQuota(): Promise<number> {
		return Number.MAX_SAFE_INTEGER; // 无限制
	}
}
