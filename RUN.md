# How to Run the HRMS Project

## Prerequisites (already installed on your machine)

| Tool | Version | Check |
|------|---------|-------|
| Java | 21+ (you have 25) | `java -version` |
| Maven | 3.9+ (you have 3.9.11) | `mvn -version` |
| Node.js | 20+ (you have 22) | `node -v` |
| PostgreSQL | running locally on port 5432 | `pg_isready` |

---

## Option A: Everything in Docker (Recommended for quick start)

All services (backend, frontend, database) run inside Docker containers.

### Start
```bash
make up-dev
```

### Stop
```bash
make down
```

### Access
| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:8081    |
| DB       | localhost:5433           |

### Restart after code changes
```bash
make restart-dev
```

### Useful Docker Commands
| Command              | What it does                    |
|----------------------|---------------------------------|
| `make status`        | Show running containers         |
| `make health`        | Check service health            |
| `make build`         | Rebuild Docker images           |
| `make clean`         | Delete everything (containers, volumes, images) |
| `make logs`          | View all logs                   |
| `make logs-backend`  | Backend logs only               |
| `make logs-frontend` | Frontend logs only              |

---

## Option B: Docker Backend + Local Frontend

Backend and database run in Docker. Frontend runs locally on your machine (faster for frontend development).

### Step 1 — Start backend + database only
```bash
docker compose up -d postgres backend
```

### Step 2 — Start frontend locally
```bash
cd frontend
npm run dev
```

### Stop
```bash
# Stop frontend: Ctrl+C in its terminal
# Stop Docker services:
docker compose down
```

### Access
| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:8081    |
| DB       | localhost:5433           |

---

## Option C: 100% Local — No Docker at All

Backend, frontend, and database all run directly on your machine.

### Prerequisites

PostgreSQL must be running locally. Start it if it's not:
```bash
sudo systemctl start postgresql
```

Then create the database and user (run once):
```bash
sudo -u postgres psql -c "CREATE USER hrms_user WITH PASSWORD 'hrms_password';"
sudo -u postgres psql -c "CREATE DATABASE hrms_db OWNER hrms_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hrms_db TO hrms_user;"
```

### Step 1 — Set environment variables
```bash
export DB_USERNAME=hrms_user
export DB_PASSWORD=hrms_password
export JWT_SECRET="your-secret-key-change-in-production-must-be-32-chars"
```

### Step 2 — Run the backend
```bash
cd backend
mvn spring-boot:run
```

Backend starts on **http://localhost:8080**

### Step 3 — Run the frontend (in a new terminal)
```bash
cd frontend
npm run dev
```

Frontend starts on **http://localhost:5173**

### Stop
- Backend: `Ctrl+C`
- Frontend: `Ctrl+C`
- PostgreSQL (optional): `sudo systemctl stop postgresql`

### Access
| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:8080    |
| DB       | localhost:5432           |

---

## Option D: 100% Local with H2 Database (No PostgreSQL needed)

Use the H2 in-memory database — no PostgreSQL setup required. Fastest for development.

### Step 1 — Run the backend with the `dev` profile
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Backend starts on **http://localhost:8082** (note: port 8082, not 8080)

H2 Console available at: **http://localhost:8082/h2-console**
- JDBC URL: `jdbc:h2:mem:hrmsdev`
- Username: `sa`
- Password: `sa`

### Step 2 — Update vite proxy to point to port 8082

Edit `frontend/vite.config.ts` and change the proxy target:
```ts
target: 'http://127.0.0.1:8082',
```

### Step 3 — Run the frontend (in a new terminal)
```bash
cd frontend
npm run dev
```

Frontend starts on **http://localhost:5173**

### Stop
- Backend: `Ctrl+C`
- Frontend: `Ctrl+C`

⚠️ **Note:** H2 is in-memory — data is lost when you stop the backend.

---

## Vite HMR Loop Fix

If you see `hmr update /src/index.css (x100+)`, the Vite cache is corrupted:
```bash
cd frontend
rm -rf node_modules/.vite .vite dist
npm run dev
```

---

## Which option should I use?

| Scenario | Use |
|----------|-----|
| Just using the app | **Option A** (Docker everything) |
| Developing frontend | **Option B** (local frontend for faster HMR) |
| Developing backend | **Option C** (local backend) or **Option D** (H2, no DB setup) |
| Quick testing, no DB | **Option D** (H2 in-memory) |
