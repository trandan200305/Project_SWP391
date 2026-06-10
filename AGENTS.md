# AGENTS.md — Project Context for AI Agents
# Version: 1.0.0 | Updated: 2026-05-27 | Project: vLance Freelance Marketplace (CNY)

## 1. PROJECT OVERVIEW
Name: vLance Freelance Marketplace (LancerPro / CNY)
Type: Full-stack Web Application (Spring Boot API + React SPA)
Domain: Freelance Marketplace (Clients post projects, Freelancers submit proposals, perform work, get paid via Escrow system, Admin moderates and resolves disputes)
Stage: Development (Sprint 1)

## 2. TECH STACK (STRICT — do not deviate)
- **Backend:** Java 17, Spring Boot 3.x, Spring Security (JWT), Spring Data JPA, Hibernate, WebSocket.
- **Frontend:** React 18 (with JavaScript/JSX), Vite, CSS (Vanilla CSS & Tailwind CSS).
- **Database:** SQL Server (Database name: `CNY`, Schema uses lowercase snake_case for tables and columns).
- **Build Tools:** Maven (`pom.xml` for backend), npm (`package.json` for frontend).
- **Third-Party Services:** Email Service (AWS SES / SendGrid), Payment Gateway (VNPay / Momo / PayPal).

## 3. ARCHITECTURE PRINCIPLES
- **Backend:** Layered Architecture. Follow the strict boundary: `Controller` -> `Service` -> `Repository` (JPA).
  - Domain entities are strictly isolated (e.g., separate concrete tables for `freelancers`, `employers`, and `admins`).
  - Business logic must reside entirely in the `Service` layer, not in Controllers or Repositories.
  - Centralized exception handling using `@ControllerAdvice` and `@ExceptionHandler`.
  - JPA/Hibernate for database operations. Raw SQL queries must only be used if explicitly required or for complex reporting/native database operations.
- **Frontend:** Component-based UI.
  - Store reusable components in `frontend/src/components/`.
  - Manage state carefully (React hooks: `useState`, `useEffect`, `useContext`).
  - WebSocket connection for real-time notifications and chat features.
  - Avoid inline styles. Use Vanilla CSS or Tailwind CSS utility classes.
- **API Style:** Strict RESTful API design. Endpoints prefixed with `/api/v1/`.

## 4. FILE NAMING & STRUCTURE
- **Backend (Java):**
  - Classes/Interfaces: PascalCase (`UserController.java`, `UserService.java`, `UserRepository.java`).
  - Methods/Variables: camelCase (`getUserById`, `emailVerified`).
  - Package structure: `com.cny.backend` (subfolders: `config`, `controller`, `service`, `repository`, `entity`, `dto`, `exception`).
- **Frontend (React):**
  - Component files: PascalCase (`Login.jsx`, `Register.jsx`, `ProjectDetail.jsx`).
  - Utilities/Helper functions: camelCase (`formatCurrency.js`, `apiService.js`).
  - Styles: camelCase or kebab-case for CSS classes.
- **Database (SQL Server):**
  - Tables: Plural lowercase snake_case (`freelancers`, `employers`, `saved_jobs`).
  - Columns: Lowercase snake_case (`freelancer_id`, `password_hash`, `agreed_amount`).

## 5. FORBIDDEN PATTERNS
- **NEVER** store plain text passwords, API keys, or database credentials in the codebase or commit `.env` files to Git. Always use environment variables / Spring properties (`application.properties` / `application.yml`).
- **NEVER** bypass Spring Security or disable CSRF/CORS completely without proper IP/domain whitelisting.
- **NEVER** write raw SQL queries using string concatenation (high risk of SQL Injection). Always use Parameterized queries, JPQL, or Spring Data JPA query methods.
- **NEVER** delete user files or database tables/migration files without explicit human confirmation.
- **NEVER** print stack traces directly in client API responses. Log internally using a structured logger (SLF4J / Logback) and return generic user-friendly errors to clients.

## 6. DEFINITION OF DONE (per task)
- [ ] Code compiles and runs locally on standard ports (Backend: `8080`, Frontend: `3000` / `5173`).
- [ ] Code conforms to project conventions and naming standards.
- [ ] Input validation is thoroughly implemented on both Frontend (zod/form validation) and Backend (JAX-RS `@Valid`, custom validators).
- [ ] Error cases (400, 401, 403, 404, 409, 500) are handled correctly and return uniform error payloads.
- [ ] Real-time aspects (if any) have been tested via WebSocket / events.
- [ ] No TODO/FIXME comments are left unresolved in the merged code.
- [ ] The feature is completely documented (Swagger/OpenAPI for APIs, inline JSDoc/Javadocs).

## 7. GIT CONVENTIONS
- **Branch Naming:**
  - `spec/[feature-name]` for specification drafts.
  - `agent/[feature-name]` or `feat/[feature-name]` for implementation.
  - `fix/[bug-name]` for hotfixes.
- **Commit Messages:** Follow Conventional Commits format: `<type>(<scope>): <short description>`.
  - *Example:* `feat(auth): implement JWT refresh token rotation`
  - *Example:* `fix(wallet): resolve race condition in top-up callback`

## 8. CURRENT SPRINT CONTEXT
- **Sprint:** Sprint 1 - Foundation & Authentication.
- **Focus:** Complete database setup, user registration, secure login with JWT, role-based authorization for Freelancers, Employers, and Admins.
- **Active specs:**
  - `.sdd/features/auth/SPEC.md`
