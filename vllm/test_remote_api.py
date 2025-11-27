#!/usr/bin/env python3
"""从远程电脑测试 BGE API (使用局域网 IP)"""

import requests
import json

# 修改为你的服务器 IP
API_BASE = "http://10.216.186.24:8001"

print("=" * 60)
print("远程测试 BGE API 服务")
print(f"服务器: {API_BASE}")
print("=" * 60)

try:
    # 1. 健康检查
    print("\n1. 健康检查...")
    response = requests.get(f"{API_BASE}/", timeout=5)
    print("✅ 服务在线!")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    # 2. 测试嵌入
    print("\n2. 测试文本嵌入...")
    response = requests.post(
        f"{API_BASE}/embed",
        json={"texts": ["测试文本"], "normalize": True},
        timeout=10
    )
    result = response.json()
    print(f"✅ 嵌入维度: {result['dimension']}")
    
    # 3. 测试重排序
    print("\n3. 测试文档重排序...")
    response = requests.post(
        f"{API_BASE}/rerank",
        json={
            "query": "人工智能",
            "documents": ["AI技术", "天气预报"],
            "top_k": 1
        },
        timeout=10
    )
    result = response.json()
    print(f"✅ 最相关文档: {result['results'][0]['document']}")
    
    print("\n" + "=" * 60)
    print("✅ 远程访问测试成功!")
    print("=" * 60)
    
except requests.exceptions.ConnectionError:
    print("\n❌ 连接失败!")
    print("\n可能的原因:")
    print("  1. 服务器未启动")
    print("  2. 防火墙阻止了端口 8001")
    print("  3. IP 地址不正确")
    print("\n解决方法:")
    print("  1. 确保服务器已启动")
    print("  2. 运行 '配置防火墙.bat'")
    print("  3. 确认服务器 IP 是 10.216.186.24")
    
except Exception as e:
    print(f"\n❌ 错误: {e}")
