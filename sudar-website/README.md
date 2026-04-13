# Sudar Website

The official public website for Sudar - The Operating System for Learning.

## 🎯 Purpose

This is a modern, responsive marketing website designed to:
- Showcase Sudar's product value and features
- Guide users to the LMS entry points (Studio and Learn)
- Build brand trust and credibility
- Provide documentation and resources

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) to view the site.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
sudar-website/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── features/          # Features page
│   │   ├── pricing/           # Pricing page
│   │   ├── about/             # About page
│   │   └── get-started/       # Quick start guide
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Layout components (Header, Footer)
│   │   └── sections/          # Page sections (Hero, Features, etc.)
│   ├── lib/                   # Utility functions
│   └── data/                  # Static data and content
├── public/                    # Static assets
├── Dockerfile                 # Production Docker image
├── tailwind.config.ts         # Tailwind CSS configuration
└── next.config.mjs            # Next.js configuration
```

## 🎨 Design System

### Colors
- **Primary**: Indigo (#6366F1) - Main brand color
- **Accent**: Cyan (#06B6D4) - Accent highlights
- **Brand Purple**: #7C3AED
- **Brand Blue**: #3B82F6

### Typography
- **Headings**: Georgia (serif) - Professional, elegant
- **Body**: Inter (sans-serif) - Clean, readable
- **Code**: JetBrains Mono (monospace)

### Key Design Principles
1. **Modern SaaS aesthetic** - Clean, professional, tech-forward
2. **Mobile-first responsive** - All breakpoints optimized
3. **Dark mode support** - Automatic theme detection
4. **Accessible** - WCAG 2.1 AA compliant
5. **Performant** - Optimized loading and interactions

## 📄 Pages

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Hero, features overview, CTA |
| Features | `/features` | Detailed feature breakdown |
| Pricing | `/pricing` | Pricing plans and FAQ |
| About | `/about` | Story, mission, team |
| Get Started | `/get-started` | Quick start guide |

## 🐳 Docker Deployment

The website is configured to work with Docker:

```bash
# Build the image
docker build -t sudar-website .

# Run the container
docker run -p 3002:3002 sudar-website
```

### Using Docker Compose

The website is included in the root `docker-compose.yml`:

```bash
# Build and run all services
docker-compose up -d --build

# Run only the website
docker-compose up -d website
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT_WEBSITE_HOST` | External port | `3002` |
| `PORT_WEBSITE_CONTAINER` | Container port | `3002` |
| `NEXT_PUBLIC_BASE_PATH_WEBSITE` | Base path for deployment | `` |

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Docker, Vercel-ready

## 🎯 Key Features

1. **Responsive Design** - Mobile-first approach
2. **Dark Mode** - System preference detection + manual toggle
3. **Animations** - Smooth scroll and interaction animations
4. **SEO Optimized** - Meta tags, Open Graph, structured data
5. **Performance** - Optimized images, lazy loading, code splitting

## 📊 Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.0s
- Cumulative Layout Shift: < 0.1

## 🔗 Links

- **Main Repository**: [github.com/Dhanikesh-Karunanithi/Sudar](https://github.com/Dhanikesh-Karunanithi/Sudar)
- **Documentation**: [ECOSYSTEM.md](../ECOSYSTEM.md)
- **Deployment Guide**: [docs/DOCKER_DEPLOYMENT.md](../docs/DOCKER_DEPLOYMENT.md)

## 📝 Content Management

Content is primarily managed through:
1. **Component-level** - Static content in React components
2. **Data files** - Reusable data in `src/data/`
3. **Markdown** - Blog posts and documentation

## 🤝 Contributing

1. Follow the design system
2. Maintain responsive design
3. Test dark mode
4. Ensure accessibility
5. Update documentation

## 📜 License

Apache-2.0 - Same as the main Sudar project.

---

**Sudar** - *Learns with you, for you.*
