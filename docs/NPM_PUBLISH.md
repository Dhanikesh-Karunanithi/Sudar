# Publish @sudar/mcp-server to npm

```bash
cd packages/sudar-mcp
npm run build
npm login
npm publish --access public
```

Package name: `@sudar/mcp-server` (see [package.json](../packages/sudar-mcp/package.json)).

After publish, users can run:

```bash
npx @sudar/mcp-server
```

Requires env: `SUDAR_LEARN_URL`, `SUDAR_ALP_API_KEY` (integrator) or `SUDAR_ACCESS_TOKEN` + `SUDAR_STUDIO_URL` (creator).
