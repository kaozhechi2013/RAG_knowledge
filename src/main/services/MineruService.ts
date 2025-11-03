/**
 * MinerU Service - Integrates MinerU PDF to Markdown conversion
 *
 * This service wraps the MinerU Python CLI to provide PDF-to-Markdown conversion
 * functionality for knowledge base preprocessing.
 *
 * Features:
 * - PDF to Markdown conversion using MinerU
 * - Support for OCR-based and text-based PDFs
 * - Configurable language support
 * - Formula and table extraction
 */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { loggerService } from "@logger";
import { app } from "electron";

const logger = loggerService.withContext("MineruService");

export interface MineruOptions {
	/** Output directory for conversion results */
	outputDir?: string;
	/** OCR language (default: 'ch' for Chinese) */
	lang?: string;
	/** Parse method: 'auto', 'txt', or 'ocr' */
	parseMethod?: "auto" | "txt" | "ocr";
	/** Enable formula recognition */
	formulaEnable?: boolean;
	/** Enable table recognition */
	tableEnable?: boolean;
	/** Start page ID (0-based) */
	startPageId?: number;
	/** End page ID */
	endPageId?: number;
}

export interface MineruResult {
	/** Success status */
	success: boolean;
	/** Path to generated Markdown file */
	markdownPath?: string;
	/** Path to output directory */
	outputDir?: string;
	/** Error message if failed */
	error?: string;
}

class MineruService {
	private mineruPath: string;
	private pythonPath: string;

	constructor() {
		// MinerU source code location
		this.mineruPath = path.join(
			app.getAppPath(),
			"MinerU-mineru-2.6.3-released",
		);

		// Python executable path (needs to be configured based on environment)
		// For development, use system Python
		// For production, bundle Python with the app
		this.pythonPath = "python"; // Will need to update this for production
	}

	/**
	 * Convert PDF to Markdown using MinerU
	 * @param pdfPath Path to the PDF file
	 * @param options MinerU conversion options
	 * @returns Conversion result with Markdown path
	 */
	async convertPdfToMarkdown(
		pdfPath: string,
		options: MineruOptions = {},
	): Promise<MineruResult> {
		try {
			// Validate input file exists
			if (!fs.existsSync(pdfPath)) {
				throw new Error(`PDF file not found: ${pdfPath}`);
			}

			// Set default options
			const {
				outputDir = path.join(path.dirname(pdfPath), "mineru_output"),
				lang = "ch",
				parseMethod = "auto",
				formulaEnable = true,
				tableEnable = true,
				startPageId = 0,
				endPageId = 99999,
			} = options;

			// Ensure output directory exists
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			logger.info(`Converting PDF with MinerU: ${pdfPath}`);
			logger.info(`Output directory: ${outputDir}`);

			// Build MinerU CLI arguments
			const args = [
				"-m",
				"mineru.cli.client", // Run as module
				"-p",
				pdfPath,
				"-o",
				outputDir,
				"-m",
				parseMethod,
				"-b",
				"pipeline", // Use pipeline backend for better compatibility
				"-l",
				lang,
				"-s",
				startPageId.toString(),
				"-e",
				endPageId.toString(),
			];

			if (!formulaEnable) {
				args.push("--not-formula");
			}
			if (!tableEnable) {
				args.push("--not-table");
			}

			// Execute MinerU
			const result = await this.executePythonCommand(args);

			if (!result.success) {
				return {
					success: false,
					error: result.error,
				};
			}

			// Find the generated Markdown file
			const pdfBasename = path.basename(pdfPath, path.extname(pdfPath));
			const markdownPath = path.join(
				outputDir,
				pdfBasename,
				"auto",
				`${pdfBasename}.md`,
			);

			if (!fs.existsSync(markdownPath)) {
				// Try alternative paths
				const altMarkdownPath = path.join(outputDir, `${pdfBasename}.md`);
				if (fs.existsSync(altMarkdownPath)) {
					return {
						success: true,
						markdownPath: altMarkdownPath,
						outputDir,
					};
				}

				throw new Error(`Generated Markdown file not found: ${markdownPath}`);
			}

			logger.info(`Successfully converted PDF to Markdown: ${markdownPath}`);

			return {
				success: true,
				markdownPath,
				outputDir,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			logger.error(`MinerU conversion failed: ${errorMessage}`);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Execute Python command with MinerU
	 * @param args Command line arguments
	 * @returns Execution result
	 */
	private async executePythonCommand(
		args: string[],
	): Promise<{ success: boolean; error?: string }> {
		return new Promise((resolve) => {
			const pythonProcess = spawn(this.pythonPath, args, {
				cwd: this.mineruPath,
				env: {
					...process.env,
					PYTHONPATH: this.mineruPath,
				},
			});

			let stderr = "";

			pythonProcess.stdout.on("data", (data) => {
				const output = data.toString();
				logger.debug(`MinerU stdout: ${output}`);
			});

			pythonProcess.stderr.on("data", (data) => {
				const output = data.toString();
				stderr += output;
				logger.debug(`MinerU stderr: ${output}`);
			});

			pythonProcess.on("close", (code) => {
				if (code === 0) {
					resolve({ success: true });
				} else {
					resolve({
						success: false,
						error: `MinerU process exited with code ${code}. Stderr: ${stderr}`,
					});
				}
			});

			pythonProcess.on("error", (error) => {
				resolve({
					success: false,
					error: `Failed to start MinerU: ${error.message}`,
				});
			});
		});
	}

	/**
	 * Check if MinerU is properly installed
	 * @returns True if MinerU is available
	 */
	async checkInstallation(): Promise<boolean> {
		try {
			// Check if MinerU source directory exists
			if (!fs.existsSync(this.mineruPath)) {
				logger.error(`MinerU source directory not found: ${this.mineruPath}`);
				return false;
			}

			// Check if mineru module exists
			const mineruModulePath = path.join(this.mineruPath, "mineru");
			if (!fs.existsSync(mineruModulePath)) {
				logger.error(`MinerU module not found: ${mineruModulePath}`);
				return false;
			}

			// Try to execute a simple Python command to verify Python is available
			const result = await this.executePythonCommand(["--version"]);

			return result.success;
		} catch (error) {
			logger.error(`MinerU installation check failed: ${error}`);
			return false;
		}
	}

	/**
	 * Get MinerU version
	 * @returns Version string or null if not available
	 */
	async getVersion(): Promise<string | null> {
		try {
			const versionFile = path.join(this.mineruPath, "mineru", "version.py");
			if (!fs.existsSync(versionFile)) {
				return null;
			}

			const content = fs.readFileSync(versionFile, "utf-8");
			const match = content.match(/__version__\s*=\s*['"]([^'"]+)['"]/);
			return match ? match[1] : null;
		} catch (error) {
			logger.error(`Failed to get MinerU version: ${error}`);
			return null;
		}
	}
}

// Export singleton instance
export const mineruService = new MineruService();
