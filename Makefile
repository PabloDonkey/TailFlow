SHELL := /bin/bash

.PHONY: install run

install:
	@set -euo pipefail; \
	echo "Setting up backend virtual environment..."; \
	if [ ! -d backend/.venv ]; then \
		python3 -m venv backend/.venv; \
	fi; \
	( cd backend && ./.venv/bin/python -m pip install -e ".[dev]" ); \
	if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "Created backend/.env from backend/.env.example"; \
	fi; \
	echo "Installing frontend dependencies..."; \
	cd frontend && npm install

run:
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
	backend_pid=''; \
	trap 'if [ -n "$$backend_pid" ]; then kill "$$backend_pid"; wait "$$backend_pid" 2>/dev/null || true; fi' EXIT INT TERM; \
	( cd backend && exec ./.venv/bin/python -m uvicorn app.main:app --reload ) & \
	backend_pid=$$!; \
	echo "Backend running at http://localhost:8000 (PID $$backend_pid)"; \
	echo "Starting frontend at http://localhost:5173"; \
	cd frontend && npm run dev
