#!/bin/bash
# ============================================================
# Vilvom Application — E2E Networks Deployment Script
# Run this on the E2E Ubuntu VM as root or sudo user
# ============================================================
set -e

echo "=== Vilvom Production Deployment ==="

# ── 1. Install Docker if not present ────────────────────────
if ! command -v docker &>/dev/null; then
  echo "[1/6] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "[1/6] Docker already installed."
fi

# Install docker compose plugin
if ! docker compose version &>/dev/null; then
  apt-get install -y docker-compose-plugin
fi

# ── 2. Configure firewall ────────────────────────────────────
echo "[2/6] Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# ── 3. Pull / build images ───────────────────────────────────
echo "[3/6] Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

# ── 4. Start all services ────────────────────────────────────
echo "[4/6] Starting services..."
docker compose -f docker-compose.prod.yml up -d

# ── 5. Wait for health checks ────────────────────────────────
echo "[5/6] Waiting for services to be healthy (60s)..."
sleep 60

docker compose -f docker-compose.prod.yml ps

# ── 6. Show public IP ────────────────────────────────────────
PUBLIC_IP=$(curl -s ifconfig.me)
echo ""
echo "[6/6] Deployment complete!"
echo ""
echo "  Backend API:  http://$PUBLIC_IP/api"
echo "  Swagger docs: http://$PUBLIC_IP/api/docs"
echo "  YOLO health:  http://$PUBLIC_IP/yolo/health"
echo ""
echo "  Update your React Native app:"
echo "  PROD_API  = 'http://$PUBLIC_IP'"
echo "  PROD_AI_API = 'http://$PUBLIC_IP'"
echo ""
echo "  Set these in: src/config/api.ts"
