# Sudar Docker Deployment Guide

This guide explains how to deploy Sudar using Docker Compose for production environments. Docker deployment provides a unified, containerized approach that simplifies configuration management and enables flexible deployment options.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Port Configuration](#port-configuration)
- [Relative Path Deployment](#relative-path-deployment)
- [External Nginx Configuration](#external-nginx-configuration)
- [Service Architecture](#service-architecture)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying Sudar with Docker, ensure you have:

1. **Docker Engine** 20.10+ installed
2. **Docker Compose** v2.0+ installed
3. A **Supabase project** with:
   - Database URL and connection pool URL
   - Anon key and Service Role key
   - Storage bucket `course-media` (public read)
4. At least one **AI provider API key** (Together AI, OpenAI, or Anthropic)

### Verify Prerequisites

```bash
# Check Docker version
docker --version
# Expected: Docker version 20.10.x or higher

# Check Docker Compose version
docker compose version
# Expected: Docker Compose version v2.x.x
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Dhanikesh-Karunanithi/Sudar.git
cd Sudar
```

### 2. Create Environment File

```bash
cp .env.docker.example .env
```

### 3. Configure Required Variables

Edit `.env` and fill in the required values:

```bash
# Required: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@pooler.supabase.com:6543/postgres?pgbouncer=true

# Required: Auth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_generated_secret_here

# Required: At least one AI provider
TOGETHER_API_KEY=your_together_ai_key
# Optional: OPENAI_API_KEY, ANTHROPIC_API_KEY
```

### 4. Build and Start Services

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Check service status
docker compose ps
```

### 5. Verify Deployment

```bash
# Check Studio (default port 3000)
curl http://localhost:3000

# Check Learn (default port 3001)
curl http://localhost:3001

# Check Intelligence health (default port 8000)
curl http://localhost:8000/api/health
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJ...` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://...` |
| `NEXTAUTH_SECRET` | Auth secret (32+ chars) | Generate with `openssl rand -base64 32` |
| `TOGETHER_API_KEY` | Together AI API key | `xxx...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT_STUDIO` | Studio container port | `3000` |
| `PORT_LEARN` | Learn container port | `3001` |
| `PORT_INTEL` | Intelligence container port | `8000` |
| `NEXT_PUBLIC_BASE_PATH_STUDIO` | Base path for Studio | (none) |
| `NEXT_PUBLIC_BASE_PATH_LEARN` | Base path for Learn | (none) |
| `CORS_ORIGINS` | Production CORS origins | (none) |
| `CORS_DEFAULT_ORIGINS` | Development CORS origins | `http://localhost:3000,http://localhost:3001` |
| `OPENAI_API_KEY` | OpenAI API key | (none) |
| `ANTHROPIC_API_KEY` | Anthropic API key | (none) |

### AI Provider Configuration

Sudar supports multiple AI providers with automatic fallback:

```bash
# Primary provider (recommended)
TOGETHER_API_KEY=your_together_key

# Fallback providers (optional)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### CORS Configuration

For production deployment, configure CORS to allow your frontend origins:

```bash
# For production with custom domain
CORS_ORIGINS=https://sudar.example.com

# For production with separate domains
CORS_ORIGINS=https://studio.yourorg.com,https://learn.yourorg.com

# For localhost development (default)
CORS_DEFAULT_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Port Configuration

All service ports are configurable via environment variables:

```bash
# Custom ports
PORT_STUDIO=8080
PORT_LEARN=8081
PORT_INTEL=8082
```

After changing ports, rebuild and restart:

```bash
docker compose down
docker compose up -d --build
```

## Relative Path Deployment

Sudar supports deploying all services under a single domain with different base paths. This is useful when you want to serve Studio, Learn, and Intelligence from the same domain.

### Configuration

```bash
# .env
NEXT_PUBLIC_BASE_PATH_STUDIO=/studio
NEXT_PUBLIC_BASE_PATH_LEARN=/learn
```

### How It Works

With base paths configured:

- Studio assets are served from `https://sudar.example.com/studio/*`
- Learn assets are served from `https://sudar.example.com/learn/*`
- Intelligence API is typically at `https://sudar.example.com/api/*`

### Important Notes

1. **Build-time configuration**: `NEXT_PUBLIC_BASE_PATH` is evaluated at build time. If you change these values, you must rebuild the Docker images:

   ```bash
   docker compose build studio learn
   docker compose up -d
   ```

2. **Nginx configuration**: Your reverse proxy must strip the base path before forwarding to the container. See [External Nginx Configuration](#external-nginx-configuration) for examples.

## External Nginx Configuration

Since Sudar Docker deployment does not include Nginx, you need to configure your own reverse proxy. Here are example configurations:

### Same Domain with Relative Paths

```nginx
# /etc/nginx/sites-available/sudar.example.com

server {
    listen 80;
    server_name sudar.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sudar.example.com;

    ssl_certificate /etc/letsencrypt/live/sudar.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sudar.example.com/privkey.pem;

    # Studio → /studio
    location /studio/ {
        rewrite ^/studio/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Learn → /learn
    location /learn/ {
        rewrite ^/learn/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Intelligence API → /api
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Separate Subdomains

```nginx
# /etc/nginx/sites-available/sudar.conf

# Studio
server {
    listen 443 ssl http2;
    server_name studio.sudar.example.com;

    ssl_certificate /etc/letsencrypt/live/sudar.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sudar.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Learn
server {
    listen 443 ssl http2;
    server_name learn.sudar.example.com;

    ssl_certificate /etc/letsencrypt/live/sudar.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sudar.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Intelligence API
server {
    listen 443 ssl http2;
    server_name api.sudar.example.com;

    ssl_certificate /etc/letsencrypt/live/sudar.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sudar.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   studio    │  │    learn    │  │    intelligence     │  │
│  │  :${PORT_STUDIO}│ │  :${PORT_LEARN} │ │   :${PORT_INTEL}   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │  External Nginx (用户管理)  │
              │     同域名 + 相对路径       │
              │  /studio, /learn, /api     │
              └───────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │     External Services      │
              │  - Supabase (云 PostgreSQL)│
              │  - AI Providers API        │
              └───────────────────────────┘
```

### Container Communication

- Services communicate via Docker's internal network using service names
- Studio and Learn call Intelligence at `http://intelligence:8000`
- All external services (Supabase, AI APIs) are accessed over the public internet

## Health Checks

All services include health checks for monitoring:

### Studio Health Check

```bash
curl http://localhost:${PORT_STUDIO}/
```

Expected: HTTP 200 with HTML response

### Learn Health Check

```bash
curl http://localhost:${PORT_LEARN}/
```

Expected: HTTP 200 with HTML response

### Intelligence Health Check

```bash
curl http://localhost:${PORT_INTEL}/api/health
```

Expected: JSON response with `{"status": "healthy"}`

### Docker Health Status

```bash
docker compose ps
```

Check the `STATUS` column for `(healthy)` indicator.

## Troubleshooting

### Common Issues

#### 1. Build Fails with "out of memory"

**Solution**: Increase Docker's memory limit in Docker Desktop settings or reduce parallel builds:

```bash
DOCKER_BUILDKIT=0 docker compose build
```

#### 2. Services Can't Connect to Supabase

**Symptoms**: Database connection errors in logs

**Solutions**:
- Verify `DATABASE_URL` uses the connection pooler URL (port 6543)
- Check that Supabase project is not paused
- Ensure network allows outbound connections to Supabase

#### 3. CORS Errors in Browser Console

**Symptoms**: "CORS policy" errors when calling Intelligence API

**Solutions**:
- For production: Set `CORS_ORIGINS` to your frontend URLs
- For development: `CORS_DEFAULT_ORIGINS` should include your dev URLs
- Restart Intelligence after changing CORS settings

#### 4. Static Assets Not Loading with Base Path

**Symptoms**: 404 errors for JS/CSS files when using base path

**Solutions**:
- Ensure `NEXT_PUBLIC_BASE_PATH_*` is set **before** building
- Rebuild containers after changing base path: `docker compose build studio learn`
- Verify Nginx is stripping the base path correctly

#### 5. Container Restarts Continuously

**Diagnosis**:

```bash
# Check container logs
docker compose logs studio
docker compose logs learn
docker compose logs intelligence

# Check health check status
docker inspect sudar-studio | grep -A 10 Health
```

**Common causes**:
- Missing required environment variables
- Invalid database connection
- Missing dependencies

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f studio
docker compose logs -f learn
docker compose logs -f intelligence

# Last 100 lines
docker compose logs --tail=100 studio
```

### Restarting Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart studio
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Updating Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build
```

## Resource Limits

Default resource limits in `docker-compose.yml`:

| Service | Memory Limit | Memory Reservation |
|---------|--------------|-------------------|
| Studio | 1 GB | 512 MB |
| Learn | 1 GB | 512 MB |
| Intelligence | 2 GB | 1 GB |

Adjust in `docker-compose.yml` if needed:

```yaml
services:
  studio:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

## Security Considerations

1. **Never commit `.env` to version control**
2. Use strong, unique `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
3. Restrict Supabase service role key usage to server-side only
4. Configure CORS to only allow your production domains
5. Use HTTPS in production (via Nginx with Let's Encrypt)
6. Keep Docker and base images updated regularly
7. Review and rotate API keys periodically

## Production Checklist

Before deploying to production:

- [ ] All required environment variables are set
- [ ] `NEXTAUTH_SECRET` is a strong, unique value
- [ ] CORS origins are configured for production domains
- [ ] Database uses connection pooler (port 6543)
- [ ] Nginx is configured with HTTPS
- [ ] Health checks are passing
- [ ] Resource limits are appropriate for your server
- [ ] Log rotation is configured (default: 10MB × 3 files)

## Support

For issues and questions:

- GitHub Issues: https://github.com/Dhanikesh-Karunanithi/Sudar/issues
- Documentation: See `docs/` directory
- ECOSYSTEM.md: Full project architecture and context
