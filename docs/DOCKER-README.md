# HRMS Docker Setup

This document describes how to set up and run the HRMS application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.20+
- Make (optional, but recommended)

## Quick Start

1. **Clone and configure:**
   ```bash
   cp .env.example .env
   # Edit .env if needed (especially JWT_SECRET for production)
   ```

2. **Build and run:**
   ```bash
   make build
   make up
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html
   - Database: localhost:5432

## Development Mode

For development with hot reload:

```bash
make up-dev
```

This will start:
- Frontend on http://localhost:5173 with hot reload
- Backend on http://localhost:8080 with Spring DevTools
- Database on localhost:5432

## Useful Commands

### Using Makefile (recommended)
```bash
make help          # Show all available commands
make build         # Build all images
make up            # Start all services
make down          # Stop all services
make logs          # View logs
make status        # Show container status
make clean         # Remove everything
make test          # Run backend tests
make test-frontend # Run frontend tests
make shell-backend # Open shell in backend container
make shell-db      # Open psql shell in database
```

### Using Docker Compose directly
```bash
docker-compose up -d          # Start services
docker-compose down           # Stop services
docker-compose logs -f        # Follow logs
docker-compose ps             # Check status
docker-compose exec backend sh  # Access backend container
```

## Service Details

### Backend (Spring Boot)
- **Port:** 8080
- **Health check:** http://localhost:8080/actuator/health
- **API Docs:** http://localhost:8080/swagger-ui.html
- **Environment variables:** See `.env.example`

### Frontend (React + Vite)
- **Port:** 80 (production), 5173 (development)
- **API proxy:** All `/api/*` requests are proxied to backend
- **Environment variables:** Set in docker-compose.yml

### Database (PostgreSQL)
- **Port:** 5432
- **Database:** hrms
- **Username:** hrms_user
- **Password:** hrms_password
- **Data volume:** Persists in `postgres_data` volume

## Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Key variables:
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- Database credentials (for external connections)
- `SPRING_PROFILES_ACTIVE`: Spring profile (docker, development, production)
- `VITE_API_BASE_URL`: Frontend API base URL

## Database Management

### Backup database:
```bash
make db-backup
```

### Restore database:
```bash
docker-compose exec -T postgres psql -U hrms_user -d hrms < backup_file.sql
```

### Access database shell:
```bash
make shell-db
```

## Troubleshooting

### 1. Port conflicts
If ports are already in use, modify ports in `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Change external port
```

### 2. Build failures
```bash
# Clean and rebuild
make clean
make build
```

### 3. Database connection issues
```bash
# Check if database is running
make logs-db

# Test connection
docker-compose exec postgres pg_isready -U hrms_user -d hrms
```

### 4. Application not starting
```bash
# Check logs
make logs

# Check health
make health
```

## Production Considerations

1. **Change JWT_SECRET** in `.env` file
2. **Use SSL/TLS** for production
3. **Configure proper database backups**
4. **Set up monitoring and logging**
5. **Use Docker secrets for sensitive data**
6. **Configure resource limits** in docker-compose.yml

## CI/CD Integration

The Docker setup is ready for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: make build
      - run: make test
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (nginx)       │◄──►│   (Spring Boot) │◄──►│   (PostgreSQL)  │
│   Port: 80      │    │   Port: 8080    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                          Docker Network
```

## License

This Docker setup is part of the HRMS project.