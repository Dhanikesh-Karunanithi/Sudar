# Sudar Website - Configuration Files Update

## ✅ 已完成的更新

### 1. 环境变量配置
**文件**: `.env.docker.example`

添加了 Website 服务的端口配置：
```bash
# Website (Public Marketing Website)
PORT_WEBSITE_HOST=3002
PORT_WEBSITE_CONTAINER=3002
```

### 2. Docker Compose 配置
**文件**: `docker-compose.yml`

添加了 `website` 服务定义：
```yaml
website:
  build:
    context: ./sudar-website
    dockerfile: Dockerfile
  container_name: sudar-website
  restart: unless-stopped
  ports:
    - "${PORT_WEBSITE_HOST:-3002}:${PORT_WEBSITE_CONTAINER:-3002}"
  environment:
    - NODE_ENV=production
    - PORT=${PORT_WEBSITE_CONTAINER:-3002}
  networks:
    - sudar-network
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3002/"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
  deploy:
    resources:
      limits:
        memory: 512M
      reservations:
        memory: 256M
```

### 3. 文档更新
**文件**: `docs/DOCKER_DEPLOYMENT.md`

更新了以下内容：
- ✅ 添加了 Website 健康检查命令
- ✅ 更新了端口配置表格
- ✅ 更新了环境变量表格
- ✅ 更新了服务架构图
- ✅ 更新了资源限制表格

---

## 🐳 服务架构

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

---

## 📝 部署命令

```bash
# 启动所有服务（包括 Website）
docker-compose up -d

# 仅启动 Website
docker-compose up -d website

# 查看 Website 日志
docker-compose logs -f website

# 验证服务状态
docker-compose ps
```

---

## 🔧 技术栈

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Animation**: Framer Motion
- **Icons**: Lucide React

---

## 📚 相关文档

- [Website README](./sudar-website/README.md)
- [Website Quick Start](./sudar-website/QUICK_START.md)
- [Website Project Summary](./sudar-website/PROJECT_SUMMARY.md)
- [Docker Deployment Guide](./docs/DOCKER_DEPLOYMENT.md)
- [Configuration Updates](./CONFIGURATION_UPDATES.md)

---

**更新日期**: 2026-04-13  
**状态**: ✅ 所有配置文件已更新完成  
**分支**: docker-deployment-refactor
