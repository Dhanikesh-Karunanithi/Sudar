# Sudar Website - Quick Start Guide

## 🚀 快速开始

### 方式 1: 本地开发

```bash
# 进入项目目录
cd sudar-website

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3002
```

### 方式 2: Docker 部署

```bash
# 在项目根目录
cd /workspace/project/Sudar

# 启动所有服务（包括官网）
docker-compose up -d

# 或仅启动官网
docker-compose up -d website

# 访问 http://localhost:3002
```

### 方式 3: 生产构建

```bash
cd sudar-website

# 构建
npm run build

# 启动生产服务器
npm start

# 访问 http://localhost:3002
```

## 📁 项目结构

```
sudar-website/
├── src/
│   ├── app/                 # 页面路由
│   ├── components/          # React 组件
│   └── lib/                 # 工具函数
├── public/                  # 静态资源
├── Dockerfile               # Docker 配置
└── package.json             # 依赖管理
```

## 🎨 核心功能

- ✅ 响应式设计（移动优先）
- ✅ 深色模式支持
- ✅ 流畅动画效果
- ✅ SEO 优化
- ✅ PWA 支持

## 📄 主要页面

| 页面 | 路径 | 描述 |
|------|------|------|
| 首页 | `/` | 产品介绍和核心价值 |
| 功能 | `/features` | 详细功能展示 |
| 定价 | `/pricing` | 价格方案和 FAQ |
| 关于 | `/about` | 项目故事和团队 |
| 开始 | `/get-started` | 快速部署指南 |

## 🐳 Docker 配置

网站已集成到主项目的 `docker-compose.yml`：

```yaml
services:
  website:
    container_name: sudar-website
    ports:
      - "${PORT_WEBSITE_HOST:-3002}:${PORT_WEBSITE_CONTAINER:-3002}"
```

### 环境变量

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `PORT_WEBSITE_HOST` | 3002 | 外部访问端口 |
| `PORT_WEBSITE_CONTAINER` | 3002 | 容器内部端口 |

## 🔧 技术栈

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Animation**: Framer Motion
- **Icons**: Lucide React

## 📝 开发命令

```bash
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run start    # 生产服务器
npm run lint     # 代码检查
```

## 🚢 部署

### Docker Compose (推荐)

```bash
docker-compose up -d website
```

### Vercel

```bash
vercel --prod
```

### 手动部署

```bash
npm run build
npm start
```

## 📊 性能目标

- FCP < 1.5s
- LCP < 2.5s
- TTI < 3.0s
- CLS < 0.1

## 🎯 下一步

1. 自定义内容：修改 `src/app/` 中的页面
2. 添加分析：集成 Google Analytics
3. 博客功能：添加 `/blog` 路由
4. 多语言：实现 i18n 支持

---

**Sudar** - *Learns with you, for you.* 🚀
