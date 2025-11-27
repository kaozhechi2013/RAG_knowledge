#!/usr/bin/env python3
"""测试 BGE-M3 和 BGE Reranker 模型"""

import os
# 设置使用镜像站点，避免访问 huggingface.co
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
# 或者使用离线模式（如果模型已完全下载）
# os.environ['TRANSFORMERS_OFFLINE'] = '1'

import torch
from transformers import AutoTokenizer, AutoModel

print("=" * 60)
print("测试 BGE 模型")
print("=" * 60)

# 检查GPU
if torch.cuda.is_available():
    print(f"✅ GPU 可用: {torch.cuda.get_device_name(0)}")
    print(f"   显存: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
else:
    print("⚠️  GPU 不可用，将使用 CPU")

print("\n" + "=" * 60)
print("1. 测试 BGE-M3 嵌入模型")
print("=" * 60)

# 测试 BGE-M3 (从WSL2缓存加载)
try:
    print("加载 BGE-M3 模型...")
    m3_tokenizer = AutoTokenizer.from_pretrained('BAAI/bge-m3')
    m3_model = AutoModel.from_pretrained('BAAI/bge-m3')
    
    if torch.cuda.is_available():
        m3_model = m3_model.cuda()
    
    # 测试文本
    texts = [
        "什么是人工智能?",
        "人工智能是计算机科学的一个分支",
        "今天天气真好"
    ]
    
    print(f"✅ BGE-M3 加载成功!")
    print(f"   生成 {len(texts)} 个文本的嵌入向量...")
    
    encoded = m3_tokenizer(texts, padding=True, truncation=True, return_tensors='pt')
    if torch.cuda.is_available():
        encoded = {k: v.cuda() for k, v in encoded.items()}
    
    with torch.no_grad():
        embeddings = m3_model(**encoded).last_hidden_state[:, 0]
    
    print(f"   嵌入向量维度: {embeddings.shape}")
    print(f"   设备: {embeddings.device}")
    
    # 计算相似度
    from torch.nn.functional import cosine_similarity
    sim_01 = cosine_similarity(embeddings[0:1], embeddings[1:2]).item()
    sim_02 = cosine_similarity(embeddings[0:1], embeddings[2:3]).item()
    
    print(f"\n   相似度测试:")
    print(f"   '{texts[0]}' vs '{texts[1]}': {sim_01:.4f}")
    print(f"   '{texts[0]}' vs '{texts[2]}': {sim_02:.4f}")
    
except Exception as e:
    print(f"❌ BGE-M3 测试失败: {e}")

print("\n" + "=" * 60)
print("2. 测试 BGE Reranker v2-m3")
print("=" * 60)

# 测试 Reranker (从本地路径加载)
try:
    from transformers import AutoModelForSequenceClassification
    
    reranker_path = "/mnt/e/Project/RAG_knowledge/vllm/bge-reranker-v2-m3"
    print(f"加载 BGE Reranker 模型 (路径: {reranker_path})...")
    
    reranker_tokenizer = AutoTokenizer.from_pretrained(reranker_path)
    # Reranker 需要用 SequenceClassification 模型
    reranker_model = AutoModelForSequenceClassification.from_pretrained(reranker_path)
    reranker_model.eval()
    
    if torch.cuda.is_available():
        reranker_model = reranker_model.cuda()
    
    print(f"✅ BGE Reranker 加载成功!")
    
    # 测试重排序
    query = "什么是机器学习?"
    passages = [
        "机器学习是人工智能的一个子领域",
        "今天的天气很晴朗",
        "深度学习是机器学习的一种方法"
    ]
    
    print(f"\n   查询: {query}")
    print(f"   候选文档数: {len(passages)}")
    
    # 构建输入对
    pairs = [[query, passage] for passage in passages]
    
    with torch.no_grad():
        inputs = reranker_tokenizer(pairs, padding=True, truncation=True, return_tensors='pt', max_length=512)
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        outputs = reranker_model(**inputs, return_dict=True)
        scores = outputs.logits.view(-1,).float()
    
    print(f"\n   重排序得分:")
    for i, (passage, score) in enumerate(zip(passages, scores)):
        print(f"   [{i+1}] 得分: {score.item():.4f} - {passage}")
    
    # 排序
    sorted_idx = scores.argsort(descending=True)
    print(f"\n   排序结果:")
    for rank, idx in enumerate(sorted_idx, 1):
        print(f"   {rank}. {passages[idx]} (得分: {scores[idx].item():.4f})")
    
except Exception as e:
    print(f"❌ BGE Reranker 测试失败: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("✅ 测试完成!")
print("=" * 60)

# 明确退出
import sys
sys.exit(0)
