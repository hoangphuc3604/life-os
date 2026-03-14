# Auth Service Knowledge Capture

**Entry Point:** `services/auth-service`
**Capture Date:** 2026-02-12
**Last Updated:** 2026-03-14

## Overview
The `auth-service` is a NestJS-based microservice responsible for user authentication and authorization. It handles user registration, login, token management (issuance, rotation, revocation), and user profile retrieval.

## Architecture

### Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** JWT (JSON Web Tokens) with Passport strategy
- **Containerization:** Docker (Multi-stage build)

### Key Components

#### Prisma Module (`src/prisma`)
Global module providing PrismaClient instance.
- **Service (`PrismaService`):** Extends PrismaClient with NestJS lifecycle hooks.

#### Auth Module (`src/auth`)
The core module encapsulating all authentication logic.
- **Controller (`AuthController`):** Exposes HTTP endpoints for auth operations.
- **Service (`AuthService`):** Implements business logic for user management and token handling.
- **Strategies (`JwtStrategy`):** Handles JWT validation for protected routes.
- **Guards (`JwtAuthGuard`):** Protects endpoints requiring a valid access token.

#### Data Model (`prisma/schema.prisma`)
1.  **User (`users` table):**
    - `id` (UUID)
    - `username` (Unique)
    - `email` (Unique)
    - `passwordHash` (Bcrypt hash)
    - `roles` (String array, e.g., `['user']`)
    - `createdAt`, `updatedAt` (Timestamps)

2.  **RefreshToken (`refresh_tokens` table):**
    - `id` (UUID, used as JTI)
    - `userId` (FK to User)
    - `tokenHash` (Bcrypt hash of the actual refresh token string)
    - `expiresAt` (DateTime)
    - `revoked` (Boolean)
    - `createdAt` (DateTime)

## Authentication Flow

### 1. Registration
- **Endpoint:** `POST /auth/register`
- **Payload:** `RegisterUserDto` (username, email, password, etc.)
- **Logic:**
    - Hashes password using `bcrypt`.
    - Creates `User` record using Prisma.
    - Returns user details (excluding password).
- **Errors:** 409 Conflict if user already exists.

### 2. Login
- **Endpoint:** `POST /auth/login`
- **Payload:** `LoginUserDto` (username, password)
- **Logic:**
    - Validates credentials.
    - **Refresh Token Creation:**
        - Creates a `RefreshToken` record in DB (status `pending`).
        - Signs a JWT for the refresh token, including the entity ID (`jti`).
        - Hashes the signed JWT and updates the record with this hash.
    - **Access Token Creation:** Signs a short-lived JWT.
    - Returns `{ access_token, refresh_token }`.

### 3. Token Rotation (Refresh)
- **Endpoint:** `POST /auth/refresh`
- **Payload:** `RefreshTokenDto` (refresh_token)
- **Logic:**
    - Verifies JWT signature.
    - Retrieves `RefreshToken` record using `jti` from payload.
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
    - Marks the corresponding `RefreshToken` record as `revoked = true`.

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
    - `DATABASE_URL`: `postgresql://user:password@postgres:5432/lifeos_auth`
    - `JWT_SECRET`, `JWT_EXPIRATION`
    - `PORT`: `3000`
- **Volumes:** Mounts source code for live reload in development.

## Dependencies
- `@nestjs/common`, `@nestjs/core`, `@nestjs/config`: Core framework.
- `@prisma/client`, `prisma`: Database interaction.
- `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`: Authentication.
- `bcrypt`: Password and token hashing.
- `@nestjs/swagger`: API documentation.

## Testing
- **Unit Tests:** Located in `src/auth/*.spec.ts`, use Jest with mocked PrismaClient.
- **E2E Tests:** Located in `test/*.e2e-spec.ts`, use mocked PrismaService to avoid real database connections.
