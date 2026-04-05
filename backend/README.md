# Backend Setup

## Local Env

The backend loads a local `backend/.env` file automatically.

1. Copy `backend/.env.example` to `backend/.env`
2. Replace the placeholder values with your local values

Example:

```properties
DB_URL=jdbc:postgresql://localhost:5432/hrms_db
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-32-plus-character-secret
```

Notes:

- `JWT_SECRET` must be at least 32 characters
- `backend/.env` is ignored by git
- `backend/.env.example` is the file that should be committed and shared

## Run

From `backend/`:

```bash
mvn spring-boot:run
```

## Fedora / Linux

1. Make sure PostgreSQL is running
2. Create or confirm the database in `DB_URL`
3. Put your credentials in `backend/.env`
4. Run `mvn spring-boot:run`

## Windows

1. Make sure PostgreSQL is running
2. Create or confirm the database in `DB_URL`
3. Put your credentials in `backend/.env`
4. Run `mvn spring-boot:run`

## Useful Commands

```bash
mvn -q -DskipTests compile
mvn -q test
mvn clean package
```

## Common Problems

Wrong database password:
- Check `DB_USERNAME` and `DB_PASSWORD` in `backend/.env`

JWT startup error:
- Make sure `JWT_SECRET` exists and is at least 32 characters long

Connection refused:
- Make sure PostgreSQL is running and `DB_URL` points to the correct database
