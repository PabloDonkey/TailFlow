#!/usr/bin/env bash
set -euo pipefail

if docker compose version >/dev/null 2>&1; then
  docker info >/dev/null 2>&1 || {
    echo "Docker daemon is not reachable."
    echo "If you see permission denied, add your user to docker group and re-login:"
    echo "  sudo usermod -aG docker \"$USER\""
    exit 1
  }
  exec docker compose --env-file backend/.env "$@"
fi

if command -v docker-compose >/dev/null 2>&1; then
  docker info >/dev/null 2>&1 || {
    echo "Docker daemon is not reachable."
    echo "If you see permission denied, add your user to docker group and re-login:"
    echo "  sudo usermod -aG docker \"$USER\""
    exit 1
  }
  set -a
  . backend/.env
  set +a
  exec docker-compose "$@"
fi

echo "Neither 'docker compose' nor 'docker-compose' is available."
echo "Install Docker Compose plugin (recommended) or docker-compose v1."
exit 1
