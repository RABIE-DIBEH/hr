# GEMINI.md - Project Context

## Directory Overview
This repository contains the implementation of a **Human Resources Management System (HRMS)** with a focus on smart attendance tracking using NFC technology. The system automates manual HR processes, improves security, and provides real-time reporting for employees, managers, and HR departments.

## Technical Stack
-   **Backend**: Java 21, Spring Boot 3.2.0 (Spring Data JPA, Spring Security, JWT).
-   **Frontend**: React (TypeScript) + Vite + Tailwind CSS.
-   **Mobile**: Flutter (Dart).
-   **Database**: PostgreSQL.
-   **Hardware Integration**: NFC Readers and NFC-enabled mobile devices.

## Key Files & Directories
-   **`project structure.md`**: Comprehensive Software Requirements Specification (SRS).
-   **`backend/`**: Spring Boot application containing core business logic, API controllers, and security configuration.
-   **`frontend/`**: React-based web dashboard for Employees, Managers, and HR Specialists.
-   **`mobile/`**: Flutter application for mobile access and NFC-based clocking.
-   **`database/schema.sql`**: SQL definitions for the system's data model.
-   **`API_DOCS.md`**: Documentation for backend RESTful endpoints.
-   **`AGENTS.md`**: Specific instructions and context for AI agents working on this codebase.

## Core Modules
-   **Attendance**: Real-time check-in/out via NFC, daily departmental checks, and fraud detection.
-   **Leave Management**: Self-service requests, multi-level approvals, and automated balance tracking.
-   **Payroll**: Automated calculations based on verified attendance hours, overtime, and deductions.
-   **Employee Directory**: Centralized profile management and organizational hierarchy.

## Development Status
-   **Phase**: Implementation & Prototyping.
-   **Current State**: 
    -   Backend core entities and REST APIs are scaffolded.
    -   Web frontend UI components and dashboard layouts are in place.
    -   Mobile application (Flutter) is initialized.
    -   Database schema is defined.
-   **Next Steps**: 
    -   Finalize payroll calculation logic.
    -   Implement NFC communication protocols in the mobile app.
    -   Full integration testing between frontend and backend.
