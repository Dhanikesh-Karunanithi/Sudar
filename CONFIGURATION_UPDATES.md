# Sudar 配置文件更新总结

## 📝 更新概览

为新增的 Website 服务更新了以下配置文件：

---

## ✅ 已更新的文件

### 1. `.env.docker.example`
**位置**: `.env.docker.example`

**更新内容**:
```bash
# Website (Public Marketing Website)
PORT_WEBSITE_HOST=3002
PORT_WEBSITE_CONTAINER=3002
```

**说明**: 添加了 Website 服务的端口配置，默认端口为 3002。

---

### 2. `docker-compose.yml`
**位置**: `docker-compose.yml`

**更新内容**:
- 添加了 `website` 服务定义
- 配置了健康检查和资源限制
- 更新了 Intelligence 的 CORS 配置，包含 `http://localhost:3002`

**新增服务**:
```yaml
website:
  build:
    context: ./sudar-website
    dockerfile: Dockerfile
  container_name: sudar-website
  ports:
    - "${PORT_WEBSITE_HOST:-3002}:${PORT_WEBSITE_CONTAINER:-3002}"
  environment:
    - NODE_ENV=production
    - PORT=${PORT_WEBSITE_CONTAINER:-3002}
  networks:
    - sudar-network
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3002/"]
  deploy:
    resources:
      limits:
        memory: 512M
      reservations:
        memory: 256M
```

---

### 3. `docs/DOCKER_DEPLOYMENT.md`
**位置**: `docs/DOCKER_DEPLOYMENT.md`

**更新内容**:

#### a. 验证部署部分
添加了 Website 服务的健康检查：
```bash
# Check Website (default port 3002)
curl http://localhost:3002
```

#### b. 端口配置表格
更新了端口配置表格：
| Service | Default Port | Description |
|---------|--------------|-------------|
| Studio | 3000 | Admin/Creator application |
| Learn | 3001 | Learner application |
| Website | 3002 | Public marketing website |
| Intelligence | 8000 | AI engine |

#### c. 环境变量表格
更新了可选变量表格：
- `PORT_WEBSITE_HOST`: Website host port (default: 3002)
- `PORT_WEBSITE_CONTAINER`: Website container port (default: 3002)
- `NEXT_PUBLIC_BASE_PATH_WEBSITE`: Base path for Website (optional)

#### d. 服务架构图
更新了服务架构图，添加了 Website 服务：
```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   studio    │  │    learn    │  │    intelligence     │  │
│  │  :3000      │  │  :3001      │  │    :8000            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐                                            │
│  │   website   │                                            │
│  │  :3002      │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

#### e. 资源限制表格
更新了资源限制表格：
| Service | Memory Limit | Memory Reservation |
|---------|--------------|-------------------|
| Studio | 1 GB | 512 MB |
| Learn | 1 GB | 512 MB |
| Website | 512 MB | 256 MB |
| Intelligence | 2 GB | 1 GB |

---

## 🔧 配置说明

### 端口配置
Website 服务使用以下端口：
- **默认端口**: 3002
- **可自定义**: 通过环境变量 `PORT_WEBSITE_HOST` 和 `PORT_WEBSITE_CONTAINER`

### 环境变量
Website 服务需要的环境变量：
- `NODE_ENV=production`
- `PORT=3002` (或自定义端口)

### 资源限制
- **内存限制**: 512 MB
- **内存预留**: 256 MB

### 健康检查
- **检查方式**: HTTP GET 请求到根路径
- **检查间隔**: 30秒
- **超时时间**: 10秒
- **重试次数**: 3次
- **启动等待**: 60秒

---

## 🚀 部署指南

### 启动所有服务
```bash
# 在项目根目录
docker-compose up -d
```

### 仅启动 Website
```bash
docker-compose up -d website
```

### 查看 Website 日志
```bash
docker-compose logs -f website
```

### 验证 Website 服务
```bash
# 访问 Website
curl http://localhost:3002

# 或在浏览器打开
open http://localhost:3002
```

---

## 📊 服务概览

| 服务 | 端口 | 用途 | 状态 |
|------|------|------|------|
| Studio | 3000 | 管理/创作平台 | ✅ |
| Learn | 3001 | 学习者平台 | ✅ |
| Website | 3002 | 公众官网 | ✅ 新增 |
| Intelligence | 8000 | AI 引擎 | ✅ |

---

## 🎯 后续步骤

1. **测试部署**:
   ```bash
   docker-compose up -d
   docker-compose ps
   ```

2. **检查健康状态**:
   ```bash
   curl http://localhost:3002
   ```

3. **查看日志**:
   ```bash
   docker-compose logs -f website
   ```

4. **自定义配置** (可选):
   - 修改 `.env` 文件中的端口配置
   - 调整 `docker-compose.yml` 中的资源限制

---

## 📚 相关文档

- [Website README](./sudar-website/README.md)
- [Website 快速开始](./sudar-website/QUICK_START.md)
- [Website 项目总结](./sudar-website/PROJECT_SUMMARY.md)
- [Docker 部署指南](./docs/DOCKER_DEPLOYMENT.md)

---

**更新日期**: 2026-04-13  
**版本**: 1.0.0  
**状态**: ✅ 配置完成
