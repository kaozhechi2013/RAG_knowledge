#!/usr/bin/env python3
"""BGE API 测试客户端"""

import requests
import json

API_BASE = "http://localhost:8001"

print("=" * 60)
print("测试 BGE API 服务")
print("=" * 60)

# 1. 检查服务状态
print("\n1. 检查服务状态...")
response = requests.get(f"{API_BASE}/")
print(json.dumps(response.json(), indent=2, ensure_ascii=False))

# 2. 测试嵌入接口
print("\n2. 测试文本嵌入...")
embed_data = {
    "texts": [
        "什么是人工智能?",
        "人工智能是计算机科学的一个分支",
        "今天天气很好"
    ],
    "normalize": True
}

response = requests.post(f"{API_BASE}/embed", json=embed_data)
result = response.json()
print(f"✅ 生成了 {result['count']} 个嵌入向量")
print(f"   维度: {result['dimension']}")
print(f"   第一个向量前5维: {result['embeddings'][0][:5]}")

# 3. 测试重排序接口
print("\n3. 测试文档重排序...")
rerank_data = {
    "query": "什么是机器学习?",
    "documents": [
        "机器学习是人工智能的一个分支",
        "今天天气很晴朗",
        "深度学习属于机器学习领域",
        "我喜欢吃苹果"
    ],
    "top_k": 3
}

response = requests.post(f"{API_BASE}/rerank", json=rerank_data)
result = response.json()
print(f"✅ 查询: {result['query']}")
print(f"   返回前 {len(result['results'])} 个结果:")
for item in result['results']:
    print(f"   [{item['rank']}] 得分: {item['score']:.3f} - {item['document']}")

# 4. 查看显存状态
print("\n4. 服务状态和显存使用...")
response = requests.get(f"{API_BASE}/status")
status = response.json()
print(f"✅ GPU: {status['gpu_name']}")
print(f"   显存: {status['memory_allocated_gb']:.2f} GB / {status['memory_total_gb']:.2f} GB")

print("\n" + "=" * 60)
print("✅ 所有测试通过!")
print("=" * 60)
print(f"\n📖 在线 API 文档: {API_BASE}/docs")
