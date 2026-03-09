SHELL := /bin/bash

.PHONY: install run stop

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
	if ! grep -q '^PROJECTS_ROOT_PATH=' backend/.env; then \
		printf '\nPROJECTS_ROOT_PATH=\n' >> backend/.env; \
	fi; \
	projects_root_path=$$(awk -F= '/^PROJECTS_ROOT_PATH=/{print substr($$0, index($$0, "=") + 1); exit}' backend/.env | sed 's/^"//; s/"$$//'); \
	if [ -z "$$projects_root_path" ]; then \
		echo "PROJECTS_ROOT_PATH is not set in backend/.env."; \
		if [ -t 0 ]; then \
			while true; do \
				read -r -p "Enter the project root path (or leave blank to configure later): " projects_root_path; \
				if [ -z "$$projects_root_path" ]; then \
					echo "Leaving PROJECTS_ROOT_PATH empty. Update backend/.env before using project discovery features."; \
					break; \
				fi; \
				if [ ! -d "$$projects_root_path" ]; then \
					echo "Directory does not exist: $$projects_root_path"; \
					continue; \
				fi; \
				printf 'PROJECTS_ROOT_PATH="%s"\n' "$$projects_root_path" > backend/.env.tmp; \
				grep -v '^PROJECTS_ROOT_PATH=' backend/.env >> backend/.env.tmp; \
				mv backend/.env.tmp backend/.env; \
				echo "Saved PROJECTS_ROOT_PATH to backend/.env"; \
				break; \
			done; \
		else \
			echo "Update backend/.env and set PROJECTS_ROOT_PATH before using project discovery features."; \
		fi; \
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
	echo "Applying backend migrations..."; \
	( cd backend && ./.venv/bin/alembic upgrade head ); \
	backend_pid=''; \
	trap 'if [ -n "$$backend_pid" ]; then kill "$$backend_pid"; wait "$$backend_pid" 2>/dev/null || true; fi' EXIT INT TERM; \
	( cd backend && exec ./.venv/bin/python -m uvicorn app.main:app --reload ) & \
	backend_pid=$$!; \
	echo "Backend running at http://localhost:8000 (PID $$backend_pid)"; \
	echo "Starting frontend at http://localhost:5173"; \
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
