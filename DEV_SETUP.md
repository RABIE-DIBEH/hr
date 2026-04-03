# HRMS PRO — Developer Setup Guide

> **Two-person project** — one developer on **Windows**, one on **Fedora Linux**.  
> All commands are shown for both platforms where they differ.

---

## Prerequisites

| Tool | Windows | Fedora/Linux |
|---|---|---|
| Java 21 | Download from [adoptium.net](https://adoptium.net) | `sudo dnf install java-21-openjdk-devel` |
| Maven 3.6+ | Download from [maven.apache.org](https://maven.apache.org) | `sudo dnf install maven` |
| Node.js 18+ | Download from [nodejs.org](https://nodejs.org) | `sudo dnf install nodejs` |
| PostgreSQL 12+ | Download from [postgresql.org](https://www.postgresql.org/download/windows/) | `sudo dnf install postgresql-server postgresql` |
| Git | Download from [git-scm.com](https://git-scm.com) | `sudo dnf install git` |

---

## 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/hr.git
cd hr
```

---

## 2. PostgreSQL Setup

### Windows
Open **pgAdmin** or use **psql** from the Start Menu:
```sql
CREATE DATABASE hrms_db;
```
Then run the schema:
```cmd
psql -U postgres -d hrms_db -f database\schema.sql
```

### Fedora/Linux
```bash
# First-time setup only
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql

sudo -u postgres psql -c "CREATE DATABASE hrms_db;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'admin123';"

psql -U postgres -d hrms_db -f database/schema.sql
```

### Seed Test Data (both platforms)
After the schema, load the test users:

**Windows:**
```cmd
psql -U postgres -d hrms_db -f database\seed_test_data.sql
```

**Fedora/Linux:**
```bash
psql -U postgres -d hrms_db -f database/seed_test_data.sql
```

---

## 3. Backend Setup

The `application.properties` is already configured for local dev (port `8080`, DB `hrms_db`).

**Windows:**
```cmd
cd backend
mvnw.cmd spring-boot:run
```

**Fedora/Linux:**
```bash
cd backend
mvn spring-boot:run
```

> Backend runs at **http://localhost:8080**

---

## 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> Frontend runs at **http://localhost:5173**

---

## 5. Test Credentials

Once the backend is running and the seed data is loaded, use these accounts:

| Role | Email | Password | Dashboard |
|---|---|---|---|
| **ADMIN** | `admin@hrms.com` | `Admin@1234` | `/admin` |
| **HR** | `hr@hrms.com` | `HR@1234` | `/hr` |
| **MANAGER** | `manager@hrms.com` | `Manager@1234` | `/manager` |
| **EMPLOYEE** | `employee@hrms.com` | `Employee@1234` | `/dashboard` |

> **Note:** Passwords are stored as plain-text in the seed file. The backend automatically upgrades them to BCrypt on the **first successful login**.

### Sample NFC Card
The test employee has a linked NFC card for clock-in simulation:
- **Card UID:** `TEST-NFC-UID-0001`
- Use this UID in the `/clock` page

---

## 6. Database Config (`application.properties`)

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/hrms_db
spring.datasource.username=postgres
spring.datasource.password=admin123
jwt.secret=ChangeThisToAVeryLongSecretKeyAtLeast32CharsForHS256!!
```

> Both team members should use the **same DB password** (`admin123`) to stay in sync.

---

## 7. Useful Commands

### Backend
```bash
# Windows
mvnw.cmd clean compile
mvnw.cmd spring-boot:run

# Fedora/Linux
mvn clean compile
mvn spring-boot:run
```

### Frontend
```bash
npm run dev       # dev server (port 5173)
npm run build     # production build + type-check
npm run lint      # ESLint
npx tsc --noEmit  # type-check only
```

### Database
```bash
# Connect
psql -U postgres -d hrms_db

# Useful queries
SELECT * FROM Employees;
SELECT * FROM Attendance_Records ORDER BY CheckIn DESC;
SELECT * FROM Leave_Requests;
```

---

## 8. Cross-Platform Notes

| Topic | Detail |
|---|---|
| **Line endings** | `.gitattributes` handles CRLF (Windows) vs LF (Linux) |
| **File paths** | Always use forward slashes in code — Windows handles them fine |
| **Port conflicts** | Change in `application.properties` or `vite.config.ts` if needed |
| **Maven wrapper** | Use `mvnw.cmd` on Windows, `./mvnw` on Linux |
