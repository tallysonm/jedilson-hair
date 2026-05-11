#!/bin/bash
set -e

echo "=== Node.js version ==="
node --version

echo "=== pnpm version ==="
pnpm --version

echo "=== Building API Server ==="
pnpm --filter @workspace/api-server run build

echo "=== Copying API bundle into api/ folder ==="
cp artifacts/api-server/dist/handler/app.handler.mjs api/app.handler.mjs
echo "  api/app.handler.mjs copied ($(du -sh api/app.handler.mjs | cut -f1))"

echo "=== Building Frontend ==="
pnpm --filter @workspace/barbershop run build

echo "=== Copying frontend to root dist/ ==="
mkdir -p dist
cp -r artifacts/barbershop/dist/. dist/

echo "=== Build complete ==="
echo "dist/ contents:"
ls dist/
echo "api/ contents:"
ls api/
