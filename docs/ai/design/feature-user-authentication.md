---
phase: design
title: System Design & Architecture
description: Define the technical architecture, components, and data models
---

# System Design & Architecture

## Architecture Overview
**What is the high-level system structure?**

- **Microservices Architecture:** The system will use a microservices architecture with a dedicated `auth-service`.
- **Diagram:**
  ```mermaid
  graph TD
    Client[Web Client] -->|HTTPS/JSON| Gateway[API Gateway]
    Gateway -->|/auth/*| Auth[Auth Service]
    Gateway -->|/finance/*| Finance[Finance Service]
    Gateway -->|/knowledge/*| Knowledge[Knowledge Service]
    Gateway -->|/planner/*| Planner[Planner Service]
    Auth --> Postgres[(Auth DB - PostgreSQL)]
  ```
- **Key Components:**
    - **API Gateway:** Entry point for all client requests. Validates JWTs for protected routes (except `/auth/*`).
    - **Auth Service:** Handles registration, login, token generation (Access & Refresh tokens), and token validation.
    - **PostgreSQL:** Stores user credentials, profile data, and refresh tokens.
- **Technology Stack:**
    - **Runtime:** Node.js
    - **Language:** TypeScript
    - **Framework:** NestJS
    - **Database:** PostgreSQL (TypeORM)
    - **Auth:** JWT (jsonwebtoken), bcrypt for hashing.

## Data Models
**What data do we need to manage?**

### User Table
Stores identity information.
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `username` | VARCHAR(50) | Unique, Index |
| `email` | VARCHAR(255) | Unique, Index |
| `password_hash` | VARCHAR | Bcrypt hash |
| `roles` | TEXT[] | e.g., ['user', 'admin'] |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### OtpCode Table
Manages OTP codes for email verification and password reset.
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `email` | VARCHAR(255) | Email address for OTP delivery |
| `codeHash` | VARCHAR | Bcrypt hash of the 6-digit OTP |
| `type` | ENUM | `'register'` \| `'reset_password'` |
| `expiresAt` | TIMESTAMP | OTP expiration time |
| `createdAt` | TIMESTAMP | Record creation time |

### User Table (Updated)
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `username` | VARCHAR(50) | Unique, Index |
| `email` | VARCHAR(255) | Unique, Index |
| `password_hash` | VARCHAR | Bcrypt hash |
| `isEmailVerified` | BOOLEAN | Default: false |
| `roles` | TEXT[] | e.g., ['user', 'admin'] |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### RefreshToken Table
Manages long-lived sessions and secure logout/revocation.
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> User.id |
| `token_hash` | VARCHAR | Hashed token for security |
| `expires_at` | TIMESTAMP | |
| `revoked` | BOOLEAN | Default: false |
| `created_at` | TIMESTAMP | |

## API Design
**How do components communicate?**

- **Internal Interfaces:** REST over HTTP.
- **Endpoints:**
    - `POST /auth/register`: Create a new user. Body: `{ username, email, password }`.
    - `POST /auth/otp/send`: Send OTP to email. Body: `{ email, type? }`. Types: `'register'` | `'reset_password'`.
    - `POST /auth/otp/verify`: Verify OTP code. Body: `{ email, code, type }`. Marks email as verified on success.
    - `POST /auth/login`: Authenticate user. Body: `{ email, password }`. Returns: `{ accessToken, refreshToken }`.
    - `POST /auth/refresh`: Refresh access token. Body: `{ refreshToken }`. Checks DB for revocation.
    - `POST /auth/logout`: Invalidate refresh token. Body: `{ refreshToken }`. Marks as revoked in DB.
    - `GET /auth/me`: Get current user info. Requires valid Access Token.

## Component Breakdown
**What are the major building blocks?**

- **Auth Service:**
    - `controllers/auth.controller.ts`: Handles request logic.
    - `services/auth.service.ts`: Business logic (hash checks, token signing, DB interactions).
    - `controllers/otp.controller.ts`: Handles OTP send/verify requests.
    - `services/otp.service.ts`: Business logic (OTP generation, hashing, email delivery).
    - `services/email.service.ts`: Email delivery via SMTP/SendGrid/etc.
    - `common/types/otp.types.ts`: Centralized OTP type definitions (`OtpType`, `OTP_TYPES`, `DEFAULT_OTP_TYPE`).
    - `entities/user.entity.ts`: ORM definition for User.
    - `entities/refresh-token.entity.ts`: ORM definition for RefreshToken.
    - `entities/otp-code.entity.ts`: ORM definition for OtpCode.
    - `middleware/auth.middleware.ts`: JWT verification.
    - `routes/auth.routes.ts`: Route definitions.

## Design Decisions
**Why did we choose this approach?**

- **JWT for Access Tokens:** Stateless, scalable, and easy to propagate identity to other microservices via the Gateway.
- **PostgreSQL:** Chosen to align with the PRD and provide structured, relational data integrity for critical identity data (Users and their Refresh Tokens).
- **Separate Auth Service:** Decouples identity management from business logic (finance, knowledge, etc.), allowing independent scaling and better security.
- **Refresh Tokens in DB:** Essential for security (revocation) and user experience (long-lived sessions).

## Non-Functional Requirements
**How should the system perform?**

- **Security:**
    - Passwords must be hashed with salt (bcrypt).
    - communication over HTTPS.
    - HttpOnly cookies for refresh tokens (recommended) or secure storage.
- **Performance:** Auth checks should be low latency (< 50ms internal).
- **Scalability:** Stateless JWT allows horizontal scaling of services; DB lookups only needed for Refresh/Login.
