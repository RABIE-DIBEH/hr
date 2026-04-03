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
    -   **Backend**: Core REST APIs for Attendance, Leave Management, Payroll, and Employee Directory implemented using Spring Boot 3.2 and Java 21. JWT-based authentication and Role-Based Access Control (RBAC) are configured.
    -   **Frontend**: Responsive dashboards for all four roles (Employee, Manager, HR, Admin) implemented in React. Includes pages for attendance logs, NFC clock simulation, and payroll overview.
    -   **Database**: PostgreSQL schema defined and integrated with Spring Data JPA.
    -   **Data Initialization**: Automatic data seeding for testing is implemented.

-   **Next Steps**:
    -   **Mobile Development**: Complete the Flutter application to provide full dashboard functionality on mobile devices.
    -   **NFC Integration**: Implement native NFC reader support in the mobile app and explore USB NFC reader integration for the web dashboard.
    -   **Advanced Reporting**: Add export capabilities (PDF/Excel) for HR reports and payroll summaries.
    -   **Deployment**: Set up production environment and CI/CD pipelines.
    -   **Unit & Integration Testing**: Increase test coverage for critical business logic in both backend and frontend.
