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

## 3. Environment Configuration (.env Setup)

Create an `.env` file in the backend directory with your local development secrets. This file is **not committed to Git** and overrides `application.properties` values.

### Windows
```cmd
cd backend
copy .env.example .env.local
```

### Fedora/Linux
```bash
cd backend
cp .env.example .env.local
```

### Edit `.env.local`
```env
# Database configuration
DB_USERNAME=postgres
DB_PASSWORD=admin123

# JWT Secret (generate a new one for production)
JWT_SECRET=ChangeThisToAVeryLongSecretKeyAtLeast32CharsForHS256!!

# Environment
ENVIRONMENT=development
```

**To generate a strong JWT_SECRET:**

**Windows (PowerShell):**
```powershell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString())) | % { $_.Substring(0, 44) }
```

**Fedora/Linux (bash):**
```bash
openssl rand -base64 32
```

> The `application.properties` will automatically load these values via Spring's property placeholder syntax: `${DB_USERNAME:postgres}`, `${DB_PASSWORD:admin123}`, etc.

---

## 4. Backend Setup

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

## 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> Frontend runs at **http://localhost:5173**

## 6. Mobile App Setup

### Prerequisites
- Install Flutter SDK from [flutter.dev](https://flutter.dev)
- Run `flutter doctor` to verify installation

### Platform Generation
Platform directories (`android/`, `ios/`) are not committed to git. Generate them:

```bash
cd mobile
chmod +x setup-mobile.sh
./setup-mobile.sh
```

### Build APK
```bash
./build-apk.sh
```

**Note**: The `build-apk.sh` script will fail if platform directories are not generated first.

---
## 7. Test Credentials

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

## 8. Database Config (`application.properties`)

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/hrms_db
spring.datasource.username=postgres
spring.datasource.password=admin123
jwt.secret=ChangeThisToAVeryLongSecretKeyAtLeast32CharsForHS256!!
```

> Both team members should use the **same DB password** (`admin123`) to stay in sync.

---

## 9. Useful Commands

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

## 10. Cross-Platform Notes

| Topic | Detail |
|---|---|
| **Line endings** | `.gitattributes` handles CRLF (Windows) vs LF (Linux) |
| **File paths** | Always use forward slashes in code — Windows handles them fine |
| **Port conflicts** | Change in `application.properties` or `vite.config.ts` if needed |
| **Maven wrapper** | Use `mvnw.cmd` on Windows, `./mvnw` on Linux |

---

## 10. Windows-Specific Troubleshooting

### Common Windows Issues & Solutions

#### 1. **PostgreSQL "psql" command not found**
- **Solution**: Add PostgreSQL to PATH:
  1. Open "Edit the system environment variables"
  2. Click "Environment Variables"
  3. Under "System variables", find "Path" and click "Edit"
  4. Add: `C:\Program Files\PostgreSQL\15\bin` (adjust version if different)
  5. Restart Command Prompt/PowerShell

#### 2. **Maven "mvn" command not found**
- **Solution**: Install Maven and add to PATH, or use the wrapper:
  ```cmd
  # Use Maven wrapper (recommended)
  mvnw.cmd spring-boot:run
  
  # Or install Maven globally
  # Download from https://maven.apache.org/download.cgi
  # Add to PATH: C:\apache-maven-3.9.6\bin
  ```

#### 3. **Java 21 not recognized**
- **Solution**: Set JAVA_HOME environment variable:
  ```cmd
  setx JAVA_HOME "C:\Program Files\Java\jdk-21"
  setx PATH "%PATH%;%JAVA_HOME%\bin"
  ```
  Restart terminal after setting.

#### 4. **Port 8080 already in use**
- **Solution**: Find and kill process using port 8080:
  ```cmd
  netstat -ano | findstr :8080
  taskkill /PID <PID> /F
  ```
  Or change backend port in `backend/src/main/resources/application.properties`:
  ```properties
  server.port=8081
  ```

#### 5. **Node.js/npm command not found**
- **Solution**: Reinstall Node.js with "Add to PATH" option checked, or use nvm-windows:
  ```powershell
  # Install nvm-windows from https://github.com/coreybutler/nvm-windows
  nvm install 18
  nvm use 18
  ```

#### 6. **File path issues (backslashes vs forward slashes)**
- **Solution**: Always use forward slashes in code, Windows handles them fine:
  ```java
  // Good
  String path = "src/main/resources/application.properties";
  
  // Avoid
  String path = "src\\main\\resources\\application.properties";
  ```

#### 7. **Git line ending warnings**
- **Solution**: Configure Git for Windows:
  ```cmd
  git config --global core.autocrlf true
  git config --global core.safecrlf warn
  ```

#### 8. **Docker Desktop not starting**
- **Solution**:
  1. Ensure Windows Subsystem for Linux 2 (WSL2) is installed
  2. Enable Hyper-V in Windows Features
  3. Restart computer after Docker installation
  4. Run Docker Desktop as Administrator if needed

#### 9. **Environment variables not loading**
- **Solution**: Create `.env` file in `backend/` directory (not `.env.local`):
  ```cmd
  cd backend
  copy .env.example .env
  ```
  Spring Boot loads `.env` automatically.

#### 10. **Firewall blocking connections**
- **Solution**: Add firewall rules for:
  - PostgreSQL (port 5432)
  - Backend (port 8080) 
  - Frontend (port 5173)
  
  Or temporarily disable firewall for testing (not recommended for production).

### Quick Windows Test Commands

```cmd
# Verify installations
java -version
mvn -version
node --version
npm --version
psql --version
docker --version

# Test database connection
psql -U postgres -c "SELECT version();"

# Quick backend test
cd backend
mvnw.cmd clean compile

# Quick frontend test  
cd frontend
npm install
npx tsc --noEmit
```

### Windows PowerShell Alternatives

```powershell
# Generate JWT_SECRET
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString())) | % { $_.Substring(0, 44) }

# Check running processes on port
Get-NetTCPConnection -LocalPort 8080 | Select-Object OwningProcess

# Kill process by PID
Stop-Process -Id <PID> -Force
```
