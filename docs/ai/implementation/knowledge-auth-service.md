# Auth Service Knowledge Capture

**Entry Point:** `services/auth-service`
**Capture Date:** 2026-02-12
**Last Updated:** 2026-04-20

## Overview
The `auth-service` is a NestJS-based microservice responsible for user authentication and authorization. It handles user registration, login, token management (issuance, rotation, revocation), user profile retrieval, and OTP-based email verification and password reset.

## Architecture

### Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** JWT (JSON Web Tokens) with Passport strategy
- **Containerization:** Docker (Multi-stage build)
- **Email:** Nodemailer for OTP delivery

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

#### OTP Module (`src/otp`)
Handles OTP-based email verification and password reset.
- **Controller (`OtpController`):** Exposes HTTP endpoints for OTP operations.
- **Service (`OtpService`):** Implements OTP generation, hashing, and email delivery.
- **DTOs (`SendOtpDto`, `VerifyOtpDto`):** Request validation with class-validator.
- **Throttling:** Uses `@nestjs/throttler` to prevent OTP abuse (3 requests/minute/IP).

#### Email Module (`src/email`)
Handles email delivery.
- **Service (`EmailService`):** Sends emails via SMTP using Nodemailer.
- **Templates (`email.templates.ts`):** HTML email templates for OTP codes.

#### Common Types (`src/common/types`)
Centralized type definitions.
- **OTP Types (`otp.types.ts`):** `OTP_TYPES`, `OtpType`, `DEFAULT_OTP_TYPE` for consistent type usage across OTP module.

#### Data Model (`prisma/schema.prisma`)
1.  **User (`users` table):**
    - `id` (UUID)
    - `username` (Unique)
    - `email` (Unique)
    - `passwordHash` (Bcrypt hash)
    - `isEmailVerified` (Boolean, default: false)
    - `roles` (String array, e.g., `['user']`)
    - `createdAt`, `updatedAt` (Timestamps)

2.  **RefreshToken (`refresh_tokens` table):**
    - `id` (UUID, used as JTI)
    - `userId` (FK to User)
    - `tokenHash` (Bcrypt hash of the actual refresh token string)
    - `expiresAt` (DateTime)
    - `revoked` (Boolean)
    - `createdAt` (DateTime)

3.  **OtpCode (`otp_codes` table):**
    - `id` (UUID)
    - `email` (VARCHAR)
    - `codeHash` (Bcrypt hash of 6-digit OTP)
    - `type` (ENUM: `'register'` | `'reset_password'`)
    - `expiresAt` (DateTime)
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
- **Post-Registration:** User receives OTP via email and must verify email before full account activation.

### 2. Send OTP
- **Endpoint:** `POST /auth/otp/send`
- **Payload:** `SendOtpDto` ({ email, type? })
- **Types:** `'register'` (default) | `'reset_password'`
- **Rate Limit:** 3 requests per minute per IP
- **Logic:**
    - Generates 6-digit random OTP using `crypto.randomInt`.
    - Hashes OTP using `bcrypt.hash` (async).
    - Stores hash in `otp_codes` table with expiration (default: 5 minutes).
    - Sends plain OTP via email.
- **Errors:** 400 Bad Request on validation failure, 429 Too Many Requests on rate limit.

### 3. Verify OTP
- **Endpoint:** `POST /auth/otp/verify`
- **Payload:** `VerifyOtpDto` ({ email, code, type })
- **Logic:**
    - Finds latest non-expired OTP record for email and type.
    - Verifies code against stored hash using `bcrypt.compare` (async).
    - Deletes OTP record after successful verification.
    - If type is `'register'`: Sets `isEmailVerified = true` on user.
- **Errors:** 400 Bad Request on invalid/expired OTP.

### 4. OTP Cleanup Job
- **Schedule:** Every 15 minutes (`@Cron('*/15 * * * *')`)
- **Logic:** Deletes all expired OTP records from `otp_codes` table.
- **Logging:** Logs number of deleted records when cleanup runs.

### 4. Login
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
- **Note:** Email verification is not enforced at login (configurable).

### 5. Token Rotation (Refresh)
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

### 6. Logout
- **Endpoint:** `POST /auth/logout`
- **Payload:** `RefreshTokenDto`
- **Logic:**
    - Decodes token to get `jti`.
    - Marks the corresponding `RefreshToken` record as `revoked = true`.

### 7. Reset Password
- **Endpoint:** `POST /auth/reset-password`
- **Payload:** `ResetPasswordDto` ({ email, code, newPassword })
- **Logic:**
    - Calls `otpService.verifyOtp(email, code, 'reset_password')` to validate OTP.
    - Updates `passwordHash` for the user.
    - Logs audit entry.
- **Errors:** 400 Bad Request on invalid/expired OTP.

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
    - `SMTP_*`: Email configuration (host, port, auth)
    - `OTP_EXPIRATION_MINUTES`: Default: 5
- **Volumes:** Mounts source code for live reload in development.

## Dependencies
- `@nestjs/common`, `@nestjs/core`, `@nestjs/config`: Core framework.
- `@prisma/client`, `prisma`: Database interaction.
- `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`: Authentication.
- `@nestjs/throttler`: Rate limiting for OTP endpoints.
- `@nestjs/schedule`: Scheduled cleanup job for expired OTPs.
- `bcrypt`: Password and token hashing.
- `@nestjs/swagger`: API documentation.
- `nodemailer`, `@nestjs-modules/mailer`: Email delivery.

## Testing
- **Unit Tests:** Located in `src/auth/*.spec.ts`, use Jest with mocked PrismaClient. Note: tests for OTP module (`otp.service.spec.ts`, `otp.controller.spec.ts`) are deferred.
- **E2E Tests:** Located in `test/*.e2e-spec.ts`, use mocked PrismaService to avoid real database connections. Note: OTP flow E2E tests are deferred.

## OTP Type System

## Logging & Audit Trail

The OTP module uses NestJS built-in `Logger` for audit logging:
- **OTP Sent:** Logs email and type when OTP is generated and sent.
- **OTP Verified:** Logs success/failure with email for verification attempts.
- **Cleanup:** Logs number of expired records deleted during cleanup job.

All logs are tagged with service name (`OtpService`) for easy filtering.
Located at `src/common/types/otp.types.ts`:
```typescript
export const OTP_TYPES = ['register', 'reset_password'] as const;
export type OtpType = (typeof OTP_TYPES)[number];
export const DEFAULT_OTP_TYPE: OtpType = 'register';
```
This centralizes OTP types, ensuring consistency across DTOs, services, and Prisma schema. To add new OTP types, only this file needs modification.
