# Auth Service Knowledge Capture

**Entry Point:** `services/auth-service`
**Capture Date:** 2026-02-12

## Overview
The `auth-service` is a NestJS-based microservice responsible for user authentication and authorization. It handles user registration, login, token management (issuance, rotation, revocation), and user profile retrieval.

## Architecture

### Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL (via TypeORM)
- **Authentication:** JWT (JSON Web Tokens) with Passport strategy
- **Containerization:** Docker (Multi-stage build)

### Key Components

#### Auth Module (`src/auth`)
The core module encapsulating all authentication logic.
- **Controller (`AuthController`):** Exposes HTTP endpoints for auth operations.
- **Service (`AuthService`):** Implements business logic for user management and token handling.
- **Strategies (`JwtStrategy`):** Handles JWT validation for protected routes.
- **Guards (`JwtAuthGuard`):** Protects endpoints requiring a valid access token.

#### Data Model (`src/entities`)
1.  **User (`users` table):**
    - `id` (UUID)
    - `username` (Unique)
    - `email` (Unique)
    - `password_hash` (Bcrypt hash)
    - `roles` (Array, e.g., `['user']`)
    - `refreshTokens` (One-to-Many relation)

2.  **RefreshToken (`refresh_tokens` table):**
    - `id` (UUID, used as JTI)
    - `user_id` (FK to User)
    - `token_hash` (Bcrypt hash of the actual refresh token string)
    - `expires_at` (Date)
    - `revoked` (Boolean)

## Authentication Flow

### 1. Registration
- **Endpoint:** `POST /auth/register`
- **Payload:** `RegisterUserDto` (username, email, password, etc.)
- **Logic:**
    - Hashes password using `bcrypt`.
    - Creates `User` entity.
    - Returns user details (excluding password).
- **Errors:** 409 Conflict if user already exists.

### 2. Login
- **Endpoint:** `POST /auth/login`
- **Payload:** `LoginUserDto` (username, password)
- **Logic:**
    - Validates credentials.
    - **Refresh Token Creation:**
        - Creates a `RefreshToken` entity in DB (status `pending`).
        - signs a JWT for the refresh token, including the entity ID (`jti`).
        - Hashes the signed JWT and updates the entity with this hash.
    - **Access Token Creation:** Signs a short-lived JWT.
    - Returns `{ access_token, refresh_token }`.

### 3. Token Rotation (Refresh)
- **Endpoint:** `POST /auth/refresh`
- **Payload:** `RefreshTokenDto` (refresh_token)
- **Logic:**
    - Verifies JWT signature.
    - Retrieves `RefreshToken` entity using `jti` from payload.
    - **Security Checks:**
        - Checks if token is revoked (Reuse Detection).
        - Checks if token hash matches (using `bcrypt`).
        - Checks if expired.
    - **Rotation:**
        - Revokes the *current* token (`revoked = true`).
        - Issues a *new* Access Token and a *new* Refresh Token (following the Login flow).
    - Returns new tokens.

### 4. Logout
- **Endpoint:** `POST /auth/logout`
- **Payload:** `RefreshTokenDto`
- **Logic:**
    - Decodes token to get `jti`.
    - Marks the corresponding `RefreshToken` entity as `revoked = true`.

## Infrastructure

### Docker Configuration
The service is containerized using a multi-stage `Dockerfile`:
- **Development Target:** Installs all deps, runs `npm run start:dev`.
- **Production Target:** Installs only production deps, copies built `dist`, runs `node dist/main`.

### Orchestration (`docker-compose.yml`)
Integrated into the main stack:
- **Service Name:** `auth-service`
- **Build Context:** `./services/auth-service`
- **Ports:** Maps host `3000` to container `3000`.
- **Dependencies:** `postgres` service.
- **Environment Variables:**
    - `POSTGRES_HOST`: `postgres`
    - `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
    - `PORT`: `3000`
- **Volumes:** Mounts source code for live reload in development.

## Dependencies
- `@nestjs/common`, `@nestjs/core`, `@nestjs/config`: Core framework.
- `@nestjs/typeorm`, `typeorm`, `pg`: Database interaction.
- `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`: Authentication.
- `bcrypt`: Password and token hashing.
- `@nestjs/swagger`: API documentation.
