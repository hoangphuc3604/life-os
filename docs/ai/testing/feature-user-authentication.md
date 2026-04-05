# Testing Plan: User Authentication

## 1. Context
- **Feature**: User Authentication (Register, Login, Token Management, OTP)
- **Target Component**: `@life-os/services/auth-service`
- **Goal**: Achieve 100% Code Coverage for `AuthService`, `AuthController`, `OtpService`, and `OtpController`.

## 2. Unit Testing Strategy
We will use Jest for unit testing with mocked repositories and JWT service.

### `AuthService` Coverage
| Method | Scenario | Expected Outcome |
|--------|----------|------------------|
| `register` | Happy Path | Hashes password, saves user, returns clean user object. |
| `register` | Duplicate Email | Throws `ConflictException` (Code 23505). |
| `register` | DB Error | Throws `InternalServerErrorException`. |
| `validateUser` | Valid Creds | Returns user object. |
| `validateUser` | User Not Found | Returns `null`. |
| `validateUser` | Wrong Password | Returns `null`. |
| `login` | Happy Path | Generates tokens, hashes refresh token, saves to DB, returns tokens. |
| `login` | Invalid Creds | Throws `UnauthorizedException`. |

### `AuthController` Coverage
| Method | Scenario | Expected Outcome |
|--------|----------|------------------|
| `register` | Delegation | Calls `authService.register` with specific arguments. |
| `login` | Delegation | Calls `authService.login` with specific arguments. |

### `OtpService` Coverage
| Method | Scenario | Expected Outcome |
|--------|----------|------------------|
| `generateAndSendOtp` | Happy Path | Generates 6-digit OTP, hashes with bcrypt, saves to DB, sends email. |
| `generateAndSendOtp` | Register Type | Creates OTP record with type `'register'`. |
| `generateAndSendOtp` | Reset Password Type | Creates OTP record with type `'reset_password'`. |
| `verifyOtp` | Valid Code | Returns void, deletes OTP record, updates `isEmailVerified` for register type. |
| `verifyOtp` | Invalid Code | Throws `BadRequestException`. |
| `verifyOtp` | Expired Code | Throws `BadRequestException` (expiresAt check). |
| `verifyOtp` | No Record Found | Throws `BadRequestException`. |
| `verifyOtp` | Reset Password Type | Verifies code but does not update user record. |

### `OtpController` Coverage
| Method | Scenario | Expected Outcome |
|--------|----------|------------------|
| `sendOtp` | Happy Path | Calls `otpService.generateAndSendOtp` with email and default type. |
| `sendOtp` | With Type | Calls `otpService.generateAndSendOtp` with provided type. |
| `verifyOtp` | Happy Path | Calls `otpService.verifyOtp` with email, code, and type. |

## 3. Integration Testing Strategy (E2E)
We will use `supertest` with a test database (or in-memory sqlite/mocked typeorm) to verify the full HTTP flow.

### Auth Flows
- **Flow 1**: Register a new user -> Receive 201 Created.
- **Flow 2**: Login with created user -> Receive 200 OK + Access/Refresh Tokens.
- **Flow 3**: Login with wrong password -> Receive 401 Unauthorized.
- **Flow 4**: Register duplicate user -> Receive 409 Conflict.

### OTP Flows
- **Flow 5**: Send OTP for registration -> Receive 200 OK.
- **Flow 6**: Send OTP for password reset -> Receive 200 OK.
- **Flow 7**: Verify valid OTP for registration -> Receive 200 OK + user email verified.
- **Flow 8**: Verify invalid OTP -> Receive 400 Bad Request.
- **Flow 9**: Verify expired OTP -> Receive 400 Bad Request.
- **Flow 10**: Full registration flow: Register -> Send OTP -> Verify OTP -> Login.

## 4. Coverage Targets
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

## 5. Tools
- Jest
- @nestjs/testing
- supertest

## 6. Test Data
### OTP Types
```typescript
export const OTP_TYPES = ['register', 'reset_password'] as const;
export type OtpType = (typeof OTP_TYPES)[number];
```
When adding new OTP types, update tests accordingly.
