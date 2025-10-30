// 测试知识库搜索的脚本
const fetch = require("node-fetch");

const testConfig = {
	assistantId: "b2491632-7f94-4656-816e-9bab0e7f442c",
	knowledgeBases: [
		{
			id: "g_s0Ra6E9hJyzlTckLivx",
			name: "测试",
			model: {
				id: "BAAI/bge-m3",
				name: "BAAI/bge-m3",
				provider: "silicon",
				group: "BAAI",
			},
		},
	],
};

async function testKnowledgeSearch() {
	console.log("🧪 测试知识库搜索...\n");

	const requestBody = {
		model: "silicon:deepseek-ai/DeepSeek-V3.2-Exp",
		messages: [{ role: "user", content: "张伟杰都有哪些任务" }],
		stream: false,
		assistant_id: testConfig.assistantId,
		knowledge_bases: testConfig.knowledgeBases,
	};

	console.log("📤 发送请求...");
	console.log("Knowledge Bases:", testConfig.knowledgeBases.length);

	try {
		const response = await fetch("http://localhost:8080/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer your-api-key",
			},
			body: JSON.stringify(requestBody),
		});

		console.log("\n📥 响应状态:", response.status);

		const data = await response.json();

		console.log("\n📊 Token 使用:");
		console.log("  Prompt tokens:", data.usage?.prompt_tokens);
		console.log("  Completion tokens:", data.usage?.completion_tokens);

		console.log("\n💬 AI 回答:");
		console.log(data.choices[0]?.message?.content);

		// 检查是否使用了知识库
		if (data.usage?.prompt_tokens > 100) {
			console.log("\n✅ 知识库已注入! (Prompt tokens > 100)");
		} else {
			console.log("\n❌ 知识库未注入! (Prompt tokens 太少)");
		}
	} catch (error) {
		console.error("❌ 测试失败:", error.message);
	}
}

testKnowledgeSearch();
