# Docker Setup Summary

## What's Been Created

### 1. **Docker Configuration Files**
- `backend/Dockerfile` - Multi-stage build for Spring Boot backend
- `backend/Dockerfile.dev` - Development version with hot reload
- `frontend/Dockerfile` - Multi-stage build for React frontend
- `frontend/Dockerfile.dev` - Development version with hot reload
- `frontend/nginx.conf` - Nginx configuration for React app

### 2. **Orchestration**
- `docker-compose.yml` - Production configuration with 3 services:
  - PostgreSQL database (port 5432)
  - Spring Boot backend (port 8080)
  - React frontend with Nginx (port 80)
- `docker-compose.dev.yml` - Development overlay with hot reload
- `.env.example` - Environment variables template

### 3. **Management Tools**
- `Makefile` - Convenient commands for common operations
- `deploy.sh` - Deployment script with multiple options
- `validate-docker.sh` - Validation script for setup
- `test-docker.sh` - Comprehensive test script
- `DOCKER-README.md` - Complete documentation

### 4. **CI/CD Pipeline**
- `.github/workflows/ci.yml` - GitHub Actions workflow for:
  - Backend tests (Maven)
  - Frontend tests (npm)
  - Docker image building and pushing
  - Automated deployment

## Key Features

### Security
- Non-root user in backend container
- Environment variables for secrets
- .dockerignore files to exclude sensitive data
- JWT secret configuration

### Performance
- Multi-stage builds for smaller images
- Nginx with gzip compression and caching
- Docker layer caching
- Alpine Linux base images

### Development Experience
- Hot reload for both frontend and backend
- Remote debugging support (port 5005)
- Development-specific configuration
- Makefile with intuitive commands

### Production Readiness
- Health checks for all services
- Database persistence with volumes
- Logging configuration
- Backup and restore scripts
- Resource management

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HRMS Application                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend      │    Backend      │      Database           │
│   (React)       │   (Spring Boot) │    (PostgreSQL)         │
│   Port: 80      │   Port: 8080    │    Port: 5432           │
│   Container:    │   Container:    │    Container:           │
│   hrms-frontend │   hrms-backend  │    hrms-postgres        │
└─────────────────┴─────────────────┴─────────────────────────┘
                            │
                    Docker Network: hrms-network
```

## Getting Started

### Quick Start
```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Build and start
make build
make up

# 3. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### Development Mode
```bash
make up-dev
# Frontend: http://localhost:5173 (hot reload)
# Backend: http://localhost:8080 (hot reload)
```

## Commands Overview

### Using Makefile
```bash
make help          # Show all commands
make build         # Build images
make up            # Start services
make up-dev        # Start with hot reload
make down          # Stop services
make logs          # View logs
make status        # Check status
make test          # Run backend tests
make test-frontend # Run frontend tests
make clean         # Remove everything
```

### Using Deployment Script
```bash
./deploy.sh up           # Start production
./deploy.sh start development  # Start development
./deploy.sh backup       # Backup database
./deploy.sh update       # Update services
./deploy.sh status       # Check status
```

## Environment Variables

Key variables in `.env`:
- `JWT_SECRET` - Secret for JWT tokens (change in production!)
- Database credentials
- `SPRING_PROFILES_ACTIVE` - Spring profile
- `VITE_API_BASE_URL` - Frontend API URL

## Database Management

### Backup
```bash
make db-backup
# or
./deploy.sh backup
```

### Restore
```bash
docker compose exec -T postgres psql -U hrms_user -d hrms < backup_file.sql
```

### Access Shell
```bash
make shell-db
```

## CI/CD Pipeline

The GitHub Actions workflow:
1. Runs tests on push/PR
2. Builds and pushes Docker images on main branch
3. Deploys to production server

Required secrets:
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token
- `SSH_PRIVATE_KEY` - SSH key for deployment
- `SERVER_HOST` - Production server hostname
- `SERVER_USER` - SSH user for deployment

## Next Steps for Production

1. **Change JWT_SECRET** in `.env`
2. **Configure SSL/TLS** for HTTPS
3. **Set up monitoring** (Prometheus, Grafana)
4. **Configure logging** (ELK stack)
5. **Set up backups** (automated, offsite)
6. **Configure firewall** and network security
7. **Set resource limits** in docker-compose.yml
8. **Configure health checks** and alerts

## Troubleshooting

### Common Issues

1. **Port conflicts**: Modify ports in docker-compose.yml
2. **Build failures**: Run `make clean && make build`
3. **Database issues**: Check logs with `make logs-db`
4. **Memory issues**: Adjust resource limits in docker-compose.yml

### Debugging
```bash
# Check service health
make health

# View specific logs
make logs-backend
make logs-frontend
make logs-db

# Access container shells
make shell-backend
make shell-frontend
make shell-db
```

## Support

For issues or questions:
1. Check the logs: `make logs`
2. Validate setup: `./validate-docker.sh`
3. Check documentation: `DOCKER-README.md`

This Docker setup provides a complete, production-ready environment for the HRMS application with development tools, CI/CD integration, and comprehensive management scripts.