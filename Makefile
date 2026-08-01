SHELL := /bin/bash

.PHONY: install run stop test test-backend test-frontend test-e2e test-assets db-up db-down

install:
	@set -euo pipefail; \
	echo "Setting up backend virtual environment..."; \
	if [ ! -d backend/.venv ]; then \
		python3 -m venv backend/.venv; \
	fi; \
	( cd backend && ./.venv/bin/python -m pip install -e ".[dev]" ); \
	( cd backend && ./.venv/bin/python ../scripts/install_setup.py ); \
	git config core.hooksPath .githooks; \
	echo "Installing frontend dependencies..."; \
	cd frontend && npm install

run: db-up
	@set -euo pipefail; \
	if [ ! -x backend/.venv/bin/python ]; then \
		echo "Missing backend virtualenv at backend/.venv."; \
		echo "Run: make install"; \
		exit 1; \
	fi; \
	if [ ! -d frontend/node_modules ]; then \
		echo "Missing frontend dependencies."; \
		echo "Run: make install"; \
		exit 1; \
	fi; \
	if command -v ss >/dev/null 2>&1; then \
		if ss -ltn 'sport = :8000' | grep -q LISTEN; then \
			echo "Port 8000 is already in use."; \
			echo "Stop the existing backend process and retry, or change the backend port."; \
			echo "Tip: run 'ss -ltnp \"sport = :8000\"' to find the process."; \
			exit 1; \
		fi; \
	elif command -v lsof >/dev/null 2>&1; then \
		if lsof -nP -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then \
			echo "Port 8000 is already in use."; \
			echo "Stop the existing backend process and retry, or change the backend port."; \
			echo "Tip: run 'lsof -nP -iTCP:8000 -sTCP:LISTEN' to find the process."; \
			exit 1; \
		fi; \
	else \
		echo "Warning: neither 'ss' nor 'lsof' is available; skipping preflight port check for 8000."; \
	fi; \
	echo "Waiting for Postgres..."; \
	for attempt in $$(seq 1 30); do \
		scripts/compose.sh exec -T postgres pg_isready >/dev/null 2>&1 && break; \
		sleep 1; \
	done; \
	echo "Applying backend migrations..."; \
	( cd backend && ./.venv/bin/python ./.venv/bin/alembic upgrade head ); \
	backend_pid=''; \
	trap 'if [ -n "$$backend_pid" ]; then kill "$$backend_pid"; wait "$$backend_pid" 2>/dev/null || true; fi' EXIT INT TERM; \
	( cd backend && exec ./.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload ) & \
	backend_pid=$$!; \
	echo "Backend process started (PID $$backend_pid), waiting for readiness..."; \
	backend_health_url='http://127.0.0.1:8000/health'; \
	backend_ready=0; \
	for attempt in $$(seq 1 60); do \
		if ! kill -0 "$$backend_pid" >/dev/null 2>&1; then \
			echo "Backend process exited before becoming ready."; \
			wait "$$backend_pid" 2>/dev/null || true; \
			exit 1; \
		fi; \
		if backend/.venv/bin/python -c "import sys, urllib.request; response = urllib.request.urlopen(sys.argv[1], timeout=1); sys.exit(0 if response.status == 200 else 1)" "$$backend_health_url" >/dev/null 2>&1; then \
			backend_ready=1; \
			break; \
		fi; \
		sleep 0.5; \
	done; \
	if [ "$$backend_ready" -ne 1 ]; then \
		echo "Backend did not become ready within 30 seconds at $$backend_health_url."; \
		exit 1; \
	fi; \
	echo "Backend ready at http://0.0.0.0:8000"; \
	echo "Starting frontend at http://0.0.0.0:5173"; \
	cd frontend && npm run dev

stop:
	@set -euo pipefail; \
	stopped=0; \
	if command -v ss >/dev/null 2>&1; then \
		backend_pids=$$(ss -ltnp 'sport = :8000' 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true); \
		frontend_pids=$$(ss -ltnp '( sport = :5173 or sport = :5174 )' 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true); \
	elif command -v lsof >/dev/null 2>&1; then \
		backend_pids=$$(lsof -tiTCP:8000 -sTCP:LISTEN 2>/dev/null | sort -u || true); \
		frontend_pids=$$({ lsof -tiTCP:5173 -sTCP:LISTEN 2>/dev/null; lsof -tiTCP:5174 -sTCP:LISTEN 2>/dev/null; } | sort -u || true); \
	else \
		backend_pids=''; \
		frontend_pids=''; \
		echo "Warning: neither 'ss' nor 'lsof' is available; cannot auto-detect running dev processes."; \
	fi; \
	if [ -n "$$backend_pids" ]; then \
		kill $$backend_pids || true; \
		echo "Stopped backend uvicorn process(es)."; \
		stopped=1; \
	fi; \
	if [ -n "$$frontend_pids" ]; then \
		kill $$frontend_pids || true; \
		echo "Stopped frontend vite process(es)."; \
		stopped=1; \
	fi; \
	if [ "$$stopped" -eq 0 ]; then \
		echo "No TailFlow dev processes found."; \
	fi

test: test-backend test-frontend

test-backend:
	@set -euo pipefail; \
	if [ ! -x backend/.venv/bin/python ]; then \
		echo "Missing backend virtualenv at backend/.venv."; \
		echo "Run: make install"; \
		exit 1; \
	fi; \
	cd backend && ./.venv/bin/python -m pytest

test-frontend:
	@set -euo pipefail; \
	if [ ! -d frontend/node_modules ]; then \
		echo "Missing frontend dependencies."; \
		echo "Run: make install"; \
		exit 1; \
	fi; \
	cd frontend && npm run test

test-e2e:
	@set -euo pipefail; \
	if [ ! -d frontend/node_modules ]; then \
		echo "Missing frontend dependencies."; \
		echo "Run: make install"; \
		exit 1; \
	fi; \
	cd frontend && npm run test:e2e

test-assets:
	@set -euo pipefail; \
	python3 scripts/validate_assets_checksums.py

db-up:
	scripts/db_services.sh up

db-down:
	scripts/db_services.sh down
