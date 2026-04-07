COMPOSE ?= docker compose

.PHONY: help build up up-dev down restart-dev logs logs-backend logs-frontend logs-db clean test test-frontend verify verify-backend verify-frontend verify-compose status ps shell-backend shell-frontend shell-db db-backup db-restore backup-daily rollback restore-verify env-parity uat health

help:
	@echo "HRMS Docker Management Commands:"
	@echo ""
	@echo "  build            - Build all Docker images"
	@echo "  up               - Start all services in detached mode"
	@echo "  up-dev           - Start services with live reload (development)"
	@echo "  down             - Stop and remove all containers"
	@echo "  restart-dev      - Restart the local development stack"
	@echo "  logs             - View logs from all services"
	@echo "  logs-backend     - View backend logs"
	@echo "  logs-frontend    - View frontend logs"
	@echo "  logs-db          - View database logs"
	@echo "  clean            - Remove all containers, volumes, and images"
	@echo "  test             - Run backend tests"
	@echo "  test-frontend    - Run frontend tests"
	@echo "  verify           - Run local CI-style checks"
	@echo "  verify-backend   - Run backend Maven verification"
	@echo "  verify-frontend  - Run frontend lint, tests, and build"
	@echo "  verify-compose   - Validate docker-compose.yml"
	@echo "  status / ps      - Show container status"
	@echo "  shell-backend    - Open shell in backend container"
	@echo "  shell-frontend   - Open shell in frontend container"
	@echo "  shell-db         - Open psql shell in database"
	@echo "  backup-daily     - Create timestamped backup with retention policy"
	@echo "  restore-verify   - Restore a backup into a temporary verification database"
	@echo "  rollback         - Roll back deployment to a previous git tag"
	@echo "  env-parity       - Check environment parity expectations"
	@echo "  uat              - Generate UAT checklist for four roles"
	@echo "  health           - Check service health"
	@echo ""

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

up-dev:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up -d

down:
	$(COMPOSE) down --remove-orphans

restart-dev: down up-dev

logs:
	$(COMPOSE) logs -f --tail=200

logs-backend:
	$(COMPOSE) logs -f backend

logs-frontend:
	$(COMPOSE) logs -f frontend

logs-db:
	$(COMPOSE) logs -f postgres

clean:
	$(COMPOSE) down -v --rmi all --remove-orphans

test:
	cd backend && mvn test

test-frontend:
	cd frontend && npm run test:run

verify: verify-backend verify-frontend verify-compose

verify-backend:
	cd backend && mvn verify

verify-frontend:
	cd frontend && npm ci && npm run lint && npm run test:run && npm run build

verify-compose:
	$(COMPOSE) config

status:
	$(COMPOSE) ps

ps:
	$(COMPOSE) ps

shell-backend:
	$(COMPOSE) exec backend sh

shell-frontend:
	$(COMPOSE) exec frontend sh

shell-db:
	$(COMPOSE) exec postgres psql -U hrms_user -d hrms

db-backup:
	$(COMPOSE) exec postgres pg_dump -U hrms_user hrms > backup.sql

db-restore:
	@echo "Usage: docker compose exec -T postgres psql -U hrms_user -d hrms < backup_file.sql"

backup-daily:
	./backup-daily.sh

restore-verify:
	@echo "Usage: ./restore-verify.sh <backup-file.sql>"

rollback:
	@echo "Usage: ./rollback.sh <tag>"

env-parity:
	./check-env-parity.sh

uat:
	./uat-role-scenarios.sh

health:
	@echo "Checking services health..."
	@echo "Backend: $$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/health || echo "DOWN")"
	@echo "Frontend: $$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "DOWN")"
	@echo "Database: $$(docker compose exec postgres pg_isready -U hrms_user -d hrms >/dev/null 2>&1 && echo "UP" || echo "DOWN")"
