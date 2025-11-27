#!/usr/bin/env python3
"""
BGE 嵌入和重排模型 API 服务
提供 RESTful API 接口用于文本嵌入和重排序
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import torch
from transformers import AutoTokenizer, AutoModel, AutoModelForSequenceClassification
import uvicorn
import numpy as np

# 配置
BGE_M3_PATH = "/mnt/d/Document/AI_Models/bge-m3"
RERANKER_PATH = "/mnt/d/Document/AI_Models/bge-reranker-v2-m3"
HOST = "0.0.0.0"
PORT = 8001

app = FastAPI(title="BGE Model API", version="1.0.0")

# 全局模型对象
m3_tokenizer = None
m3_model = None
reranker_tokenizer = None
reranker_model = None

class EmbedRequest(BaseModel):
    texts: List[str]
    normalize: bool = True

class RerankRequest(BaseModel):
    query: str
    documents: List[str]
    top_k: Optional[int] = None

# OpenAI 兼容格式
class OpenAIEmbedRequest(BaseModel):
    input: List[str] | str  # 可以是单个字符串或字符串列表
    model: str = "bge-m3"
    encoding_format: Optional[str] = "float"
    dimensions: Optional[int] = None  # BGE-M3 固定 1024 维

class OpenAIRerankRequest(BaseModel):
    query: str
    documents: List[str]
    model: str = "bge-reranker-v2-m3"
    top_n: Optional[int] = None  # 返回前 N 个结果

@app.on_event("startup")
async def load_models():
    """启动时加载模型到 GPU"""
    global m3_tokenizer, m3_model, reranker_tokenizer, reranker_model
    
    print("🚀 正在加载模型...")
    
    # 加载 BGE-M3
    print("  - 加载 BGE-M3 嵌入模型...")
    m3_tokenizer = AutoTokenizer.from_pretrained(BGE_M3_PATH)
    m3_model = AutoModel.from_pretrained(BGE_M3_PATH)
    if torch.cuda.is_available():
        m3_model = m3_model.cuda()
        print(f"    ✅ BGE-M3 已加载到 GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("    ⚠️  BGE-M3 已加载到 CPU")
    
    # 加载 Reranker
    print("  - 加载 BGE Reranker 模型...")
    reranker_tokenizer = AutoTokenizer.from_pretrained(RERANKER_PATH)
    reranker_model = AutoModelForSequenceClassification.from_pretrained(RERANKER_PATH)
    reranker_model.eval()
    if torch.cuda.is_available():
        reranker_model = reranker_model.cuda()
        print("    ✅ Reranker 已加载到 GPU")
    else:
        print("    ⚠️  Reranker 已加载到 CPU")
    
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated(0) / 1024**3
        total = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"\n📊 显存使用: {allocated:.2f} GB / {total:.2f} GB")
    
    print("\n✅ 所有模型加载完成!")
    print(f"🌐 API 服务运行在: http://{HOST}:{PORT}")
    print("📖 API 文档: http://localhost:8001/docs")

@app.get("/")
async def root():
    """健康检查"""
    return {
        "status": "running",
        "models": {
            "embedding": "BGE-M3",
            "reranker": "BGE-Reranker-v2-m3"
        },
        "gpu": torch.cuda.is_available(),
        "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    }

@app.post("/embed")
async def embed_texts(request: EmbedRequest):
    """
    文本嵌入接口
    
    Args:
        texts: 要嵌入的文本列表
        normalize: 是否归一化向量 (默认 True)
    
    Returns:
        embeddings: 嵌入向量列表 (每个向量 1024 维)
    """
    try:
        # 编码
        encoded = m3_tokenizer(
            request.texts,
            padding=True,
            truncation=True,
            return_tensors='pt',
            max_length=512
        )
        
        if torch.cuda.is_available():
            encoded = {k: v.cuda() for k, v in encoded.items()}
        
        # 生成嵌入
        with torch.no_grad():
            outputs = m3_model(**encoded)
            embeddings = outputs.last_hidden_state[:, 0]  # CLS token
            
            if request.normalize:
                embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
            
            embeddings = embeddings.cpu().numpy()
        
        return {
            "embeddings": embeddings.tolist(),
            "dimension": embeddings.shape[1],
            "count": len(request.texts)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/embeddings")
async def openai_embeddings(request: OpenAIEmbedRequest):
    """
    OpenAI 兼容的嵌入接口
    
    请求格式:
    {
        "input": ["text1", "text2"] or "single text",
        "model": "bge-m3",
        "encoding_format": "float"
    }
    
    返回格式:
    {
        "object": "list",
        "data": [
            {
                "object": "embedding",
                "embedding": [0.1, 0.2, ...],
                "index": 0
            }
        ],
        "model": "bge-m3",
        "usage": {
            "prompt_tokens": 10,
            "total_tokens": 10
        }
    }
    """
    try:
        # 标准化输入为列表
        texts = [request.input] if isinstance(request.input, str) else request.input
        
        # 编码
        encoded = m3_tokenizer(
            texts,
            padding=True,
            truncation=True,
            return_tensors='pt',
            max_length=512
        )
        
        if torch.cuda.is_available():
            encoded = {k: v.cuda() for k, v in encoded.items()}
        
        # 生成嵌入
        with torch.no_grad():
            outputs = m3_model(**encoded)
            embeddings = outputs.last_hidden_state[:, 0]  # CLS token
            
            # 归一化
            embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
            embeddings = embeddings.cpu().numpy()
        
        # 构建 OpenAI 格式的响应
        data = [
            {
                "object": "embedding",
                "embedding": emb.tolist(),
                "index": idx
            }
            for idx, emb in enumerate(embeddings)
        ]
        
        # 计算 token 数量(粗略估计)
        total_tokens = sum(len(text.split()) for text in texts)
        
        return {
            "object": "list",
            "data": data,
            "model": request.model,
            "usage": {
                "prompt_tokens": total_tokens,
                "total_tokens": total_tokens
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rerank")
async def rerank_documents(request: RerankRequest):
    """
    文档重排序接口
    
    Args:
        query: 查询文本
        documents: 候选文档列表
        top_k: 返回前 k 个结果 (可选)
    
    Returns:
        results: 排序后的文档及其得分
    """
    try:
        # 构建查询-文档对
        pairs = [[request.query, doc] for doc in request.documents]
        
        # 编码
        inputs = reranker_tokenizer(
            pairs,
            padding=True,
            truncation=True,
            return_tensors='pt',
            max_length=512
        )
        
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # 计算得分
        with torch.no_grad():
            scores = reranker_model(**inputs, return_dict=True).logits.view(-1,).float()
            scores = scores.cpu().numpy()
        
        # 排序
        sorted_indices = np.argsort(scores)[::-1]
        
        # 构建结果
        results = []
        top_k = request.top_k or len(request.documents)
        
        for rank, idx in enumerate(sorted_indices[:top_k], 1):
            results.append({
                "rank": rank,
                "index": int(idx),
                "document": request.documents[idx],
                "score": float(scores[idx])
            })
        
        return {
            "query": request.query,
            "results": results,
            "total": len(request.documents)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/rerank")
async def openai_rerank(request: OpenAIRerankRequest):
    """
    OpenAI 兼容的重排序接口
    
    请求格式:
    {
        "query": "查询文本",
        "documents": ["文档1", "文档2", ...],
        "model": "bge-reranker-v2-m3",
        "top_n": 5
    }
    
    返回格式:
    {
        "object": "list",
        "data": [
            {
                "index": 0,
                "relevance_score": 0.95
            }
        ],
        "model": "bge-reranker-v2-m3",
        "usage": {
            "prompt_tokens": 10,
            "total_tokens": 100
        }
    }
    """
    try:
        # 构建查询-文档对
        pairs = [[request.query, doc] for doc in request.documents]
        
        # 编码
        inputs = reranker_tokenizer(
            pairs,
            padding=True,
            truncation=True,
            return_tensors='pt',
            max_length=512
        )
        
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # 计算得分
        with torch.no_grad():
            scores = reranker_model(**inputs, return_dict=True).logits.view(-1,).float()
            scores = scores.cpu().numpy()
        
        # 排序
        sorted_indices = np.argsort(scores)[::-1]
        
        # 构建 OpenAI 格式的结果
        top_n = request.top_n or len(request.documents)
        data = [
            {
                "index": int(idx),
                "relevance_score": float(scores[idx])
            }
            for idx in sorted_indices[:top_n]
        ]
        
        # 计算 token 数量(粗略估计)
        prompt_tokens = len(request.query.split())
        total_tokens = prompt_tokens + sum(len(doc.split()) for doc in request.documents)
        
        return {
            "object": "list",
            "data": data,
            "results": data,  # 兼容 DefaultStrategy.extractResults(data)
            "model": request.model,
            "usage": {
                "prompt_tokens": prompt_tokens,
                "total_tokens": total_tokens
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_status():
    """获取服务状态和显存使用"""
    status = {
        "models_loaded": m3_model is not None and reranker_model is not None,
        "gpu_available": torch.cuda.is_available()
    }
    
    if torch.cuda.is_available():
        status["gpu_name"] = torch.cuda.get_device_name(0)
        status["memory_allocated_gb"] = torch.cuda.memory_allocated(0) / 1024**3
        status["memory_reserved_gb"] = torch.cuda.memory_reserved(0) / 1024**3
        status["memory_total_gb"] = torch.cuda.get_device_properties(0).total_memory / 1024**3
    
    return status

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 启动 BGE 模型 API 服务")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level="info"
    )
