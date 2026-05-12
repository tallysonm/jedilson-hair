#!/bin/bash
set -e

PROJECT_ROOT="$(pwd)"
echo "[vercel-build] Project root: $PROJECT_ROOT"

# Install all workspace dependencies
pnpm install
echo "[vercel-build] Dependencies installed"

# Build frontend — Vite outputs to artifacts/barbershop/dist per vite.config.ts
pnpm --filter @workspace/barbershop run build
echo "[vercel-build] Vite build complete"

# Copy to root dist/ so Vercel finds it
rm -rf "${PROJECT_ROOT}/dist"
cp -r artifacts/barbershop/dist "${PROJECT_ROOT}/dist"
echo "[vercel-build] Copied to dist/"
ls "${PROJECT_ROOT}/dist"
