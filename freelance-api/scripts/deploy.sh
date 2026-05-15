#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG required}"
APP_ENV="${APP_ENV:?APP_ENV required}"        # staging | production
COMPOSE_FILE="/opt/freelance-api/docker-compose.yml"
APP_DIR="/opt/freelance-api"
CONTAINER="freelance-api"

echo "==> Deploying $IMAGE_TAG to $APP_ENV"

# 1. Pull the new image
docker pull "$IMAGE_TAG"

# 2. Save current container ID for rollback
PREV_ID=$(docker ps -q --filter "name=${CONTAINER}" || true)

# 3. Update the compose override with the new image
mkdir -p "$APP_DIR"
cat > "$APP_DIR/docker-compose.override.yml" <<EOF
services:
  app:
    image: ${IMAGE_TAG}
EOF

# 4. Start new container (docker compose recreates only changed services)
cd "$APP_DIR"
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --no-deps app

# 5. Wait for health check to pass (30s timeout)
echo "==> Waiting for health check..."
for i in $(seq 1 30); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")
  if [ "$STATUS" = "healthy" ]; then
    echo "==> Container healthy after ${i}s"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "==> Health check failed — rolling back"
    if [ -n "$PREV_ID" ]; then
      docker start "$PREV_ID" || true
    fi
    docker compose -f docker-compose.yml up -d --no-deps app
    exit 1
  fi
  sleep 1
done

# 6. Prune old images (keep last 3)
docker image prune -f --filter "label=org.opencontainers.image.source=https://github.com/${GITHUB_REPOSITORY:-}" || true

echo "==> Deploy complete"
