import fs from "node:fs";
import path from "node:path";
import { loggerService } from "@logger";
import AdmZip from "adm-zip";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

const logger = loggerService.withContext("WordImageCleanerNative");

/**
 * 纯Node.js实现的Word文档图片清理
 * 不依赖Python，可以直接打包到Electron应用中
 */
export class WordImageCleanerNative {
	private maxFileSize: number; // MB

	constructor(maxFileSize: number = 15) {
		this.maxFileSize = maxFileSize;
	}

	/**
	 * 检查文件是否需要清理
	 */
	public shouldClean(filePath: string, fileSizeMB: number): boolean {
		const ext = path.extname(filePath).toLowerCase();
		const isWordDoc = ext === ".docx";
		const isTooLarge = fileSizeMB > this.maxFileSize;

		if (isWordDoc && isTooLarge) {
			logger.info(
				`Word文档过大 (${fileSizeMB.toFixed(2)}MB > ${this.maxFileSize}MB)，需要清理图片: ${filePath}`,
			);
			return true;
		}

		return false;
	}

	/**
	 * 清理Word文档中的图片（纯Node.js实现）
	 */
	public async cleanImages(filePath: string): Promise<{
		success: boolean;
		originalSize: number;
		newSize: number;
		savedSize: number;
		savedPercent: number;
	}> {
		try {
			// 检查文件是否存在
			if (!fs.existsSync(filePath)) {
				throw new Error(`文件不存在: ${filePath}`);
			}

			const stats = await fs.promises.stat(filePath);
			const originalSize = stats.size / (1024 * 1024);

			logger.info(
				`开始清理Word文档图片: ${path.basename(filePath)} (${originalSize.toFixed(2)}MB)`,
			);

			// 创建备份
			const backupPath = filePath + ".backup";
			await fs.promises.copyFile(filePath, backupPath);

			try {
				// 读取docx文件
				const zip = new AdmZip(filePath);
				const zipEntries = zip.getEntries();

				// 删除所有图片相关的条目
				const entriesToRemove: string[] = [];

				zipEntries.forEach((entry) => {
					const entryName = entry.entryName.replace(/\\/g, "/");

					// 删除media文件夹中的所有文件（图片）
					if (entryName.startsWith("word/media/")) {
						entriesToRemove.push(entry.entryName);
					}
				});

				// 从zip中删除图片文件
				entriesToRemove.forEach((entryName) => {
					zip.deleteFile(entryName);
				});

				logger.debug(`删除了 ${entriesToRemove.length} 个图片文件`);

				// 处理document.xml，删除图片引用
				const docEntry = zip.getEntry("word/document.xml");
				if (docEntry) {
					const docXml = docEntry.getData().toString("utf8");
					const cleanedXml = this.removeImageReferencesFromXml(docXml);
					zip.updateFile("word/document.xml", Buffer.from(cleanedXml, "utf8"));
				}

				// 处理关系文件，删除图片关系
				const relsEntry = zip.getEntry("word/_rels/document.xml.rels");
				if (relsEntry) {
					const relsXml = relsEntry.getData().toString("utf8");
					const cleanedRels = this.removeImageReferencesFromRels(relsXml);
					zip.updateFile(
						"word/_rels/document.xml.rels",
						Buffer.from(cleanedRels, "utf8"),
					);
				}

				// 保存修改后的文件
				zip.writeZip(filePath);

				// 删除备份
				await fs.promises.unlink(backupPath);

				// 获取新文件大小
				const newStats = await fs.promises.stat(filePath);
				const newSize = newStats.size / (1024 * 1024);
				const savedSize = originalSize - newSize;
				const savedPercent = (savedSize / originalSize) * 100;

				logger.info(
					`Word文档图片清理完成: ${path.basename(filePath)}\n` +
						`  原始大小: ${originalSize.toFixed(2)}MB\n` +
						`  处理后: ${newSize.toFixed(2)}MB\n` +
						`  减少: ${savedSize.toFixed(2)}MB (${savedPercent.toFixed(1)}%)`,
				);

				return {
					success: true,
					originalSize,
					newSize,
					savedSize,
					savedPercent,
				};
			} catch (error) {
				// 恢复备份
				if (fs.existsSync(backupPath)) {
					await fs.promises.copyFile(backupPath, filePath);
					await fs.promises.unlink(backupPath);
					logger.info("处理失败，已恢复原文件");
				}
				throw error;
			}
		} catch (error) {
			logger.error(`清理Word文档图片失败: ${filePath}`, error as Error);
			throw error;
		}
	}

	/**
	 * 从XML中删除图片引用
	 */
	private removeImageReferencesFromXml(xmlContent: string): string {
		try {
			// 使用正则表达式删除所有drawing和pict标签
			// drawing: 新版Word图片
			// pict: 旧版Word图片
			let cleaned = xmlContent;

			// 删除 <w:drawing>...</w:drawing>
			cleaned = cleaned.replace(/<w:drawing[^>]*>[\s\S]*?<\/w:drawing>/g, "");

			// 删除 <w:pict>...</w:pict>
			cleaned = cleaned.replace(/<w:pict[^>]*>[\s\S]*?<\/w:pict>/g, "");

			// 删除 <v:shape>...</v:shape>（一些图形）
			cleaned = cleaned.replace(/<v:shape[^>]*>[\s\S]*?<\/v:shape>/g, "");

			return cleaned;
		} catch (error) {
			logger.warn("XML处理失败，返回原内容", error as Error);
			return xmlContent;
		}
	}

	/**
	 * 从关系文件中删除图片关系
	 */
	private removeImageReferencesFromRels(relsContent: string): string {
		try {
			const parser = new XMLParser({
				ignoreAttributes: false,
				attributeNamePrefix: "@_",
			});

			const parsed = parser.parse(relsContent);

			if (parsed.Relationships?.Relationship) {
				const relationships = Array.isArray(parsed.Relationships.Relationship)
					? parsed.Relationships.Relationship
					: [parsed.Relationships.Relationship];

				// 过滤掉图片相关的关系
				parsed.Relationships.Relationship = relationships.filter(
					(rel: Record<string, string>) => {
						const target = rel["@_Target"] || "";
						const type = rel["@_Type"] || "";

						// 删除media文件夹中的引用
						if (target.includes("media/")) {
							return false;
						}

						// 删除图片类型的关系
						if (type.includes("image")) {
							return false;
						}

						return true;
					},
				);
			}

			const builder = new XMLBuilder({
				ignoreAttributes: false,
				attributeNamePrefix: "@_",
				format: true,
			});

			return builder.build(parsed);
		} catch (error) {
			logger.warn("关系文件处理失败，返回原内容", error as Error);
			return relsContent;
		}
	}

	/**
	 * 批量处理目录中的Word文档
	 */
	public async cleanDirectory(directoryPath: string): Promise<{
		total: number;
		success: number;
		failed: number;
		skipped: number;
	}> {
		const results = {
			total: 0,
			success: 0,
			failed: 0,
			skipped: 0,
		};

		try {
			const files = await this.getAllWordFiles(directoryPath);
			results.total = files.length;

			for (const file of files) {
				try {
					const stats = await fs.promises.stat(file);
					const sizeMB = stats.size / (1024 * 1024);

					if (!this.shouldClean(file, sizeMB)) {
						results.skipped++;
						continue;
					}

					await this.cleanImages(file);
					results.success++;
				} catch (error) {
					logger.error(`处理文件失败: ${file}`, error as Error);
					results.failed++;
				}
			}

			logger.info(
				`批量处理完成: 总计${results.total}个文件, ` +
					`成功${results.success}个, 跳过${results.skipped}个, 失败${results.failed}个`,
			);

			return results;
		} catch (error) {
			logger.error(`批量处理目录失败: ${directoryPath}`, error as Error);
			throw error;
		}
	}

	/**
	 * 获取目录中所有Word文档
	 */
	private async getAllWordFiles(directoryPath: string): Promise<string[]> {
		const wordFiles: string[] = [];

		async function traverse(dir: string) {
			const entries = await fs.promises.readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);

				if (entry.isDirectory()) {
					await traverse(fullPath);
				} else if (entry.isFile()) {
					const ext = path.extname(entry.name).toLowerCase();
					if (ext === ".docx") {
						wordFiles.push(fullPath);
					}
				}
			}
		}

		await traverse(directoryPath);
		return wordFiles;
	}
}

export const wordImageCleanerNative = new WordImageCleanerNative();
