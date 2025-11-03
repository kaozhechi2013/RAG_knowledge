# 🌐 Knowledge Web 客户端

局域网访问 Knowledge AI 助手的 Web 客户端。

---

## � 完整文档

**请查看:** [LAN-SETUP-GUIDE.md](./LAN-SETUP-GUIDE.md)

包含:
- ✅ 快速开始 (3分钟配置)
- ✅ 详细配置步骤
- ✅ 监控和管理 (多人使用)
- ✅ 故障排除
- ✅ 常见问题 FAQ

---

## 🚀 快速使用

### 管理员 (首次配置)

1. **配置防火墙** (必须以管理员身份):
   ```
   右键 setup-firewall.bat → 以管理员身份运行
   ```

2. **启动 Web 服务器**:
   ```
   双击 start-server.bat
   ```

3. **启动 API Server**:
   ```
   运行根目录的: 启动Knowledge.bat
   ```

4. **分享地址给同事**:
   ```
   Web 界面: http://你的IP:8081
   API 地址: http://你的IP:8080
   ```

### 同事使用

1. 打开管理员分享的 Web 地址
2. 点击设置 ⚙️
3. 输入 API Key (向管理员索取)
4. 选择模型
5. 保存设置
6. 开始聊天!

---

## 📊 监控

**实时查看谁在使用:**
```powershell
.\monitor-connections.ps1
```

**管理用户 (IP → 姓名):**
```powershell
.\manage-users.ps1
```

---

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | Web 聊天界面 |
| `setup-firewall.bat` | 配置防火墙 (管理员运行) |
| `start-server.bat` | 启动 Web 服务器 |
| `test-lan-connection.bat` | 测试连接 |
| `monitor-connections.ps1` | 实时监控 |
| `manage-users.ps1` | 用户管理 |
| `LAN-SETUP-GUIDE.md` | 📖 完整教程 |

---

**版本:** v1.0  
**更新日期:** 2025-10-30

# 或者使用 Python 2
python -m SimpleHTTPServer 8081
```

然后局域网内其他电脑访问：
```
http://你的电脑IP:8081
```

查看你的 IP 地址：
```bash
# Windows
ipconfig

# 找到 IPv4 地址，例如：192.168.1.100
```

**使用 Node.js http-server：**

```bash
# 全局安装 http-server
npm install -g http-server

# 启动服务器
http-server -p 8081 --cors
```

### 第三步：配置 Web 客户端

1. 打开 Web 页面
2. 点击右上角 **⚙️** 设置按钮
3. 填写：
   - **API 地址**：`http://你的电脑IP:8080`（管理端的 API Server 地址）
   - **API Key**：你在管理端设置的密钥
4. 点击 **保存设置**
5. 看到 **✅ 已连接** 表示成功

### 第四步：开始使用

1. 在输入框输入问题
2. 按 Enter 或点击发送
3. 等待 AI 回复

## 🌐 部署到局域网服务器

### 使用 IIS（Windows Server）

1. 安装 IIS
2. 将 `web-client` 文件夹复制到 `C:\inetpub\wwwroot\knowledge`
3. 在 IIS 中创建网站
4. 访问 `http://服务器IP/knowledge`

### 使用 Nginx

```nginx
server {
    listen 80;
    server_name knowledge.your-company.com;
    
    root /var/www/knowledge;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 使用 Docker

创建 `Dockerfile`：

```dockerfile
FROM nginx:alpine
COPY web-client /usr/share/nginx/html
EXPOSE 80
```

构建和运行：

```bash
docker build -t knowledge-web .
docker run -d -p 8081:80 knowledge-web
```

## 🔒 安全建议

1. **启用 HTTPS**：在生产环境使用 SSL 证书
2. **强密码**：API Key 使用复杂密码
3. **防火墙**：只允许内网访问 API Server 端口
4. **访问控制**：可以在 Web 服务器层面添加认证

## 🎯 架构说明

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Web 客户端     │  HTTP   │  Knowledge App   │  LLM    │  OpenAI     │
│  (浏览器)       │ ───────>│  (管理端)        │ ───────>│  Anthropic  │
│  index.html     │         │  API Server      │         │  etc.       │
└─────────────────┘         └──────────────────┘         └─────────────┘
    用户端                      后端代理                    AI 服务
```

## 📊 支持的功能

✅ **已实现**：
- 实时聊天对话
- 多用户同时访问
- 配置保存（localStorage）
- 连接状态检测
- 错误处理

🔄 **可扩展**：
- 聊天历史记录
- 用户身份验证
- 会话管理
- 文件上传
- 流式输出（打字机效果）

## 🐛 常见问题

### Q: 连接失败怎么办？

1. 检查管理端 API Server 是否已启动
2. 确认 IP 地址和端口正确
3. 检查防火墙是否阻止了端口
4. 确认 API Key 输入正确

### Q: 如何查看 API 地址？

在管理端 Knowledge 应用中：
- 设置 → API Server → 查看服务地址

### Q: 多人同时使用会冲突吗？

不会！每个浏览器会话都是独立的，可以同时多人使用。

### Q: 如何添加用户认证？

可以在 Web 服务器层面添加 HTTP Basic Auth 或使用反向代理（如 Nginx）添加认证。

## 💡 下一步改进建议

1. **添加登录功能**：记录用户身份
2. **会话历史**：保存聊天记录
3. **美化界面**：自定义主题
4. **移动端适配**：响应式设计
5. **流式输出**：实时显示 AI 思考过程

## 📞 技术支持

如有问题，请联系管理员。
