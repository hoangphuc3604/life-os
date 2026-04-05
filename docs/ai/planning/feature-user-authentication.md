---
phase: planning
title: Project Planning & Task Breakdown
description: Break down work into actionable tasks and estimate timeline
---

# Project Planning & Task Breakdown

> **Status Update [2026-04-05]:**
> - **Foundation**: Complete.
> - **Core**: Complete (Register, Login, Refresh, Logout, Guards).
> - **OTP Module**: Complete (Send OTP, Verify OTP, Email verification on register).
> - **Status**: All planned tasks are complete.

## Milestones
**What are the major checkpoints?**

- [x] Milestone 1: Foundation Setup (NestJS, TypeORM, Postgres) - Estimate: 1 Day
- [x] Milestone 2: Core Authentication Logic (Register, Login, JWT, Guards) - Estimate: 2 Days
- [x] Milestone 3: Testing & Integration (Unit/E2E tests, Gateway config) - Estimate: 1 Day
- [x] Milestone 4: OTP Module (Email Verification, Password Reset) - Estimate: 1 Day

## Task Breakdown
**What specific work needs to be done?**

### Phase 1: Foundation
- [x] Task 1.1: Initialize `auth-service` using NestJS CLI (`nest new`).
- [x] Task 1.2: Set up PostgreSQL connection with TypeORM (Dockerize DB if needed).
- [x] Task 1.3: Define TypeORM Entities: `User` and `RefreshToken`.
- [x] Task 1.4: [CRITICAL] Install missing dependencies (`pg`, `passport`, `@nestjs/jwt`).

### Phase 2: Core Features
- [x] Task 2.1: Implement User Registration (`POST /auth/register`) with `bcrypt` hashing.
- [x] Task 2.2: Implement Login (`POST /auth/login`) with JWT and Refresh Token generation.
- [x] Task 2.3: Implement Token Refresh (`POST /auth/refresh`) and Logout (`POST /auth/logout`) with DB revocation logic.
- [x] Task 2.4: Implement JWT Strategy and Guards (`JwtAuthGuard`) for route protection.

### Phase 3: Integration & Polish
- [x] Task 3.1: Write Unit Tests for Auth Service (Service/Controller specs).
- [x] Task 3.2: Create `implementation_plan.md` for specific execution steps.
- [x] Task 3.3: (Verification) Test manually via Postman/cURL.

### Phase 4: OTP Module
- [x] Task 4.1: Create OTP types in `common/types/otp.types.ts` (`OTP_TYPES`, `OtpType`, `DEFAULT_OTP_TYPE`).
- [x] Task 4.2: Implement `SendOtpDto` and `VerifyOtpDto` with validation.
- [x] Task 4.3: Implement `OtpController` with `POST /auth/otp/send` and `POST /auth/otp/verify` endpoints.
- [x] Task 4.4: Implement `OtpService` with OTP generation, hashing, and email delivery.
- [x] Task 4.5: Implement `EmailService` with SMTP/Nodemailer.
- [x] Task 4.6: Update `PrismaService` schema with `OtpCode` model.
- [x] Task 4.7: Integrate OTP verification with user registration flow (`isEmailVerified` flag).

## Dependencies
**What needs to happen in what order?**

- Task 1.1 -> 1.2 -> 1.3 -> 2.1 -> 2.2 -> 2.3 -> 2.4 -> 3.1
- External: PostgreSQL database must be running.
- External: `api-gateway` needs to be configured to route `/auth/*` to this service.
- OTP Module: Task 4.1 -> 4.2 -> 4.3 -> 4.4 -> 4.5 -> 4.6 -> 4.7

## Timeline & Estimates
**When will things be done?**

- Total Estimate: 4 Days.
- MVP: 2 Days.

## Risks & Mitigation
**What could go wrong?**

- **Risk:** Complexity of NestJS dependency injection for beginners.
    - **Mitigation:** Follow official NestJS Auth documentation strictly.
- **Risk:** TypeORM migration issues.
    - **Mitigation:** Use `synchronize: true` only for dev, plan for proper migrations for prod.
- **Risk:** Security vulnerabilities in token handling.
    - **Mitigation:** Use `@nestjs/jwt` and `passport-jwt` standard libraries.

## Resources Needed
**What do we need to succeed?**

- Developer (Me).
- Docker (for local PostgreSQL).
- Postman/curl for testing.
