# HRMS Docker Management Makefile

.PHONY: help build up down logs clean test

# Default target
help:
	@echo "HRMS Docker Management Commands:"
	@echo ""
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services in detached mode"
	@echo "  up-dev    - Start services with live reload (development)"
	@echo "  down      - Stop and remove all containers"
	@echo "  logs      - View logs from all services"
	@echo "  logs-backend - View backend logs"
	@echo "  logs-frontend - View frontend logs"
	@echo "  logs-db   - View database logs"
	@echo "  clean     - Remove all containers, volumes, and images"
	@echo "  test      - Run backend tests"
	@echo "  test-frontend - Run frontend tests"
	@echo "  status    - Show container status"
	@echo "  shell-backend - Open shell in backend container"
	@echo "  shell-frontend - Open shell in frontend container"
	@echo "  shell-db  - Open psql shell in database"
	@echo ""

# Build all images
build:
	docker compose build

# Start all services
up:
	docker compose up -d

# Start services with live reload (development)
up-dev:
	docker compose -f docker compose.yml -f docker compose.dev.yml up -d

# Stop all services
down:
	docker compose down

# View logs
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f postgres

# Clean everything
clean:
	docker compose down -v --rmi all

# Run tests
test:
	cd backend && mvn test

test-frontend:
	cd frontend && npm test

# Show status
status:
	docker compose ps

# Open shells
shell-backend:
	docker compose exec backend sh

shell-frontend:
	docker compose exec frontend sh

shell-db:
	docker compose exec postgres psql -U hrms_user -d hrms

# Database operations
db-backup:
	docker compose exec postgres pg_dump -U hrms_user hrms > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore:
	@echo "Usage: docker compose exec -T postgres psql -U hrms_user -d hrms < backup_file.sql"

# Health checks
health:
	@echo "Checking services health..."
	@echo "Backend: $$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health || echo "DOWN")"
	@echo "Frontend: $$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "DOWN")"
	@echo "Database: $$(docker compose exec postgres pg_isready -U hrms_user -d hrms >/dev/null 2>&1 && echo "UP" || echo "DOWN")"