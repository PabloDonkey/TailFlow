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
	backend_pid=''; \
	trap 'if [ -n "$$backend_pid" ]; then kill "$$backend_pid"; wait "$$backend_pid" 2>/dev/null || true; fi' EXIT INT TERM; \
	( cd backend && exec ./.venv/bin/python -m uvicorn app.main:app --reload ) & \
	backend_pid=$$!; \
	echo "Backend running at http://localhost:8000 (PID $$backend_pid)"; \
	echo "Starting frontend at http://localhost:5173"; \
	cd frontend && npm run dev
