COMPOSE_DEV = docker compose -f docker-compose.dev.yml
COMPOSE_OBS = docker compose -f docker-compose.obs.yml

.PHONY: setup dev dev-start down down-all logs smoke-services test lint typecheck

setup:
	./scripts/setup.sh --no-start

dev:
	./scripts/setup.sh --watch

dev-start:
	./scripts/setup.sh

down:
	./scripts/local/down.sh

down-all:
	./scripts/local/down.sh --volumes

logs:
	./scripts/local/dev-logs.sh

smoke-services:
	./scripts/local/smoke-services.sh

test:
	pnpm test

lint:
	pnpm lint

typecheck:
	pnpm typecheck
