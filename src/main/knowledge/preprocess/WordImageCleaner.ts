import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { loggerService } from "@logger";
import type { FileMetadata } from "@types";

const execAsync = promisify(exec);
const logger = loggerService.withContext("WordImageCleaner");

/**
 * Word文档图片清理服务
 * 在知识库处理之前删除Word文档中的图片，以减小文件大小
 */
export class WordImageCleaner {
	private pythonScript: string;
	private maxFileSize: number; // MB

	constructor(maxFileSize: number = 15) {
		// Python脚本路径
		this.pythonScript = path.join(
			process.cwd(),
			"文档",
			"document_processor.py",
		);
		this.maxFileSize = maxFileSize;

		// 检查Python脚本是否存在
		if (!fs.existsSync(this.pythonScript)) {
			logger.warn(`Word图片清理脚本不存在: ${this.pythonScript}`);
		}
	}

	/**
	 * 检查文件是否需要清理图片
	 */
	public shouldClean(file: FileMetadata): boolean {
		const isWordDoc = [".docx", ".doc"].includes(file.ext.toLowerCase());
		const fileSizeMB = file.size / (1024 * 1024);
		const isTooLarge = fileSizeMB > this.maxFileSize;

		if (isWordDoc && isTooLarge) {
			logger.info(
				`Word文档过大 (${fileSizeMB.toFixed(2)}MB > ${this.maxFileSize}MB)，需要清理图片: ${file.name}`,
			);
			return true;
		}

		return false;
	}

	/**
	 * 清理Word文档中的图片
	 * @param file 文件元数据
	 * @returns 清理后的文件元数据
	 */
	public async cleanImages(file: FileMetadata): Promise<FileMetadata> {
		try {
			// 检查Python脚本是否存在
			if (!fs.existsSync(this.pythonScript)) {
				throw new Error(`Python脚本不存在: ${this.pythonScript}`);
			}

			// 检查文件是否存在
			if (!fs.existsSync(file.path)) {
				throw new Error(`文件不存在: ${file.path}`);
			}

			const originalSize = file.size / (1024 * 1024);
			logger.info(
				`开始清理Word文档图片: ${file.name} (${originalSize.toFixed(2)}MB)`,
			);

			// 调用Python脚本处理文件
			// --no-backup: 不创建备份（知识库系统有自己的备份机制）
			// --silent: 静默模式
			const command = `python "${this.pythonScript}" "${file.path}" --no-backup --silent`;

			const { stdout, stderr } = await execAsync(command, {
				encoding: "utf8",
				maxBuffer: 10 * 1024 * 1024, // 10MB buffer
			});

			if (stderr && stderr.trim().length > 0) {
				logger.warn(`Python脚本警告: ${stderr}`);
			}

			if (stdout && stdout.trim().length > 0) {
				logger.debug(`Python脚本输出: ${stdout}`);
			}

			// 获取处理后的文件信息
			const stats = await fs.promises.stat(file.path);
			const newSize = stats.size / (1024 * 1024);
			const savedSize = originalSize - newSize;
			const savedPercent = (savedSize / originalSize) * 100;

			logger.info(
				`Word文档图片清理完成: ${file.name}\n` +
					`  原始大小: ${originalSize.toFixed(2)}MB\n` +
					`  处理后: ${newSize.toFixed(2)}MB\n` +
					`  减少: ${savedSize.toFixed(2)}MB (${savedPercent.toFixed(1)}%)`,
			);

			// 返回更新后的文件元数据
			return {
				...file,
				size: stats.size,
				created_at: stats.mtime.toISOString(),
			};
		} catch (error) {
			logger.error(`清理Word文档图片失败: ${file.name}`, error as Error);

			// 如果清理失败，检查是否有备份需要恢复
			const backupPath = file.path + ".backup";
			if (fs.existsSync(backupPath)) {
				try {
					await fs.promises.copyFile(backupPath, file.path);
					await fs.promises.unlink(backupPath);
					logger.info(`已从备份恢复文件: ${file.name}`);
				} catch (restoreError) {
					logger.error(`恢复备份失败: ${file.name}`, restoreError as Error);
				}
			}

			throw new Error(`清理Word文档图片失败: ${(error as Error).message}`);
		}
	}

	/**
	 * 检查Python环境是否可用
	 */
	public async checkPythonEnvironment(): Promise<boolean> {
		try {
			const { stdout } = await execAsync("python --version", {
				encoding: "utf8",
			});
			logger.info(`Python环境检查通过: ${stdout.trim()}`);
			return true;
		} catch (error) {
			logger.error(
				"Python环境检查失败，无法使用Word图片清理功能",
				error as Error,
			);
			return false;
		}
	}

	/**
	 * 批量处理目录中的Word文档
	 */
	public async cleanDirectory(directoryPath: string): Promise<void> {
		try {
			if (!fs.existsSync(this.pythonScript)) {
				throw new Error(`Python脚本不存在: ${this.pythonScript}`);
			}

			logger.info(`开始批量清理目录中的Word文档: ${directoryPath}`);

			const command = `python "${this.pythonScript}" "${directoryPath}" --no-backup --silent`;
			const { stdout, stderr } = await execAsync(command, {
				encoding: "utf8",
				maxBuffer: 50 * 1024 * 1024, // 50MB buffer for directory processing
			});

			if (stderr && stderr.trim().length > 0) {
				logger.warn(`批量处理警告: ${stderr}`);
			}

			if (stdout && stdout.trim().length > 0) {
				logger.info(`批量处理输出: ${stdout}`);
			}

			logger.info(`目录批量清理完成: ${directoryPath}`);
		} catch (error) {
			logger.error(`批量清理目录失败: ${directoryPath}`, error as Error);
			throw new Error(`批量清理目录失败: ${(error as Error).message}`);
		}
	}
}

export const wordImageCleaner = new WordImageCleaner();
