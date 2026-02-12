# Testing Plan: User Authentication

## 1. Context
- **Feature**: User Authentication (Register, Login, Token Management)
- **Target Component**: `@life-os/services/auth-service`
- **Goal**: Acheive 100% Code Coverage for `AuthService` and `AuthController`.

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

## 3. Integration Testing Strategy (E2E)
We will use `supertest` with a test database (or in-memory sqlite/mocked typeorm) to verify the full HTTP flow.

- **Flow 1**: Register a new user -> Receive 201 Created.
- **Flow 2**: Login with created user -> Receive 200 OK + Access/Refresh Tokens.
- **Flow 3**: Login with wrong password -> Receive 401 Unauthorized.
- **Flow 4**: Register duplicate user -> Receive 409 Conflict.

## 4. Coverage Targets
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

## 5. Tools
- Jest
- @nestjs/testing
- supertest
