```markdown
# life-os Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns, coding conventions, and workflows used in the `life-os` TypeScript codebase. It covers how to add and enhance backend API features, modify database schemas, develop frontend features, and update deployment/CI configurations. The guide includes step-by-step instructions, code examples, and recommended commands for common tasks, helping you contribute effectively and consistently.

## Coding Conventions

### File Naming

- Use **camelCase** for file names.
  - Example: `userController.ts`, `resetPasswordDto.ts`

### Import Style

- Mixed import styles are used.
  - **Named imports** (preferred):
    ```typescript
    import { UserService } from './userService';
    ```
  - **Default imports** (when necessary):
    ```typescript
    import React from 'react';
    ```

### Export Style

- **Named exports** are preferred.
  ```typescript
  export function resetPassword() { ... }
  export const USER_ROLE = 'admin';
  ```

### Commit Messages

- Use **conventional commits** with prefixes:
  - `feat`: New features
  - `fix`: Bug fixes
  - `refactor`: Code refactoring
  - `chore`: Maintenance tasks
- Example:
  ```
  feat(user): add OTP login endpoint
  ```

## Workflows

### Add or Enhance API Feature with Documentation and Tests
**Trigger:** When adding or enhancing a backend API feature (e.g., OTP, password reset, knowledge blocks/notes).
**Command:** `/new-api-feature`

1. **Update or create DTO files** for request/response shapes.
   ```typescript
   // services/auth/src/dto/otpRequestDto.ts
   export interface OtpRequestDto {
     phoneNumber: string;
   }
   ```
2. **Update or create service and controller files** for the feature.
   ```typescript
   // services/auth/src/otp.service.ts
   export function sendOtp(dto: OtpRequestDto) { ... }
   ```
3. **Update or create module files** if needed.
4. **Add or update tests** (e.g., `.spec.ts` files).
   ```typescript
   // services/auth/src/otp.controller.spec.ts
   describe('OTP Controller', () => { ... });
   ```
5. **Update API documentation**:
   - Postman collection (`postman_collection.json`)
   - Design/planning/testing docs (`docs/ai/design/feature-*.md`, etc.)
6. **Update or create migration and schema files** if database changes are involved.
7. **Update frontend API hooks and UI** if the feature is user-facing.

### Add or Modify Database Schema with Migration
**Trigger:** When adding or modifying database tables, fields, or relations.
**Command:** `/new-table`

1. **Edit the Prisma schema file**:
   ```prisma
   model User {
     id    String @id @default(uuid())
     email String @unique
   }
   ```
2. **Generate a new migration SQL file**:
   ```
   npx prisma migrate dev --name add-user-table
   ```
3. **Update the migration lock file** (`migration_lock.toml`).
4. **Update service code** to use the new/changed schema.
5. **Update `.env.example`** if new environment variables are needed.

### Frontend Feature Development with Hooks and UI
**Trigger:** When adding or enhancing a frontend feature or UI improvement.
**Command:** `/new-frontend-feature`

1. **Create or update React components** for the feature.
   ```tsx
   // web/src/components/OtpInput.tsx
   export function OtpInput() { ... }
   ```
2. **Create or update React hooks** for data fetching/mutations.
   ```typescript
   // web/src/hooks/useOtp.ts
   export function useOtp() { ... }
   ```
3. **Update API client files** if backend endpoints change.
4. **Update or add UI components** (dialogs, buttons, modals).
5. **Update pages and routes** as needed.

### Update Deployment and CI/CD Configuration
**Trigger:** When improving deployment, adding new environments, or fixing CI/CD issues.
**Command:** `/update-deployment`

1. **Edit Dockerfiles** for affected services.
2. **Edit `docker-compose*.yml` files**.
3. **Edit GitHub Actions workflow files** (`.github/workflows/*.yml`).
4. **Update deployment scripts or documentation**.

## Testing Patterns

- **Testing Framework:** [Jest](https://jestjs.io/)
- **Test File Pattern:** `*.spec.ts`
- **Test Example:**
  ```typescript
  // services/auth/src/otp.controller.spec.ts
  describe('OTP Controller', () => {
    it('should send OTP', async () => {
      // test implementation
    });
  });
  ```
- Place tests alongside the files they test, using the `.spec.ts` suffix.

## Commands

| Command               | Purpose                                                      |
|-----------------------|--------------------------------------------------------------|
| /new-api-feature      | Add or enhance a backend API feature with docs and tests     |
| /new-table            | Add or modify database schema with migration                 |
| /new-frontend-feature | Implement or enhance a frontend feature with hooks and UI    |
| /update-deployment    | Update deployment and CI/CD configuration                    |
```