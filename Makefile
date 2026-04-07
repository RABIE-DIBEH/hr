COMPOSE ?= docker compose

.PHONY: help up-dev down-dev restart-dev logs ps build verify verify-backend verify-frontend verify-compose

help:
	@echo "Available targets:"
	@echo "  make up-dev           Build and start the local stack"
	@echo "  make down-dev         Stop and remove the local stack"
	@echo "  make restart-dev      Restart the local stack"
	@echo "  make logs             Stream service logs"
	@echo "  make ps               Show service status"
	@echo "  make build            Build backend and frontend images"
	@echo "  make verify           Run local CI-style checks"
	@echo "  make verify-backend   Run backend Maven verification"
	@echo "  make verify-frontend  Run frontend lint, tests, and build"
	@echo "  make verify-compose   Validate docker-compose.yml"

up-dev:
	$(COMPOSE) up --build -d

down-dev:
	$(COMPOSE) down --remove-orphans

restart-dev: down-dev up-dev

logs:
	$(COMPOSE) logs -f --tail=200

ps:
	$(COMPOSE) ps

build:
	$(COMPOSE) build

verify: verify-backend verify-frontend verify-compose

verify-backend:
	cd backend && mvn verify

verify-frontend:
	cd frontend && npm ci && npm run lint && npm run test:run && npm run build

verify-compose:
	$(COMPOSE) config
