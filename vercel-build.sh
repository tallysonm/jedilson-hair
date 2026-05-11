#!/bin/bash
set -e

echo "=== Node.js version ==="
node --version

echo "=== pnpm version ==="
pnpm --version

echo "=== Building API Server ==="
pnpm --filter @workspace/api-server run build

echo "=== Building Frontend ==="
pnpm --filter @workspace/barbershop run build

echo "=== Copying frontend to root dist/ ==="
mkdir -p dist
cp -r artifacts/barbershop/dist/. dist/

echo "=== Build complete — dist/ contents ==="
ls -la dist/
