# WorkSphere Backend

WorkSphere is a full-stack employee and user management application backend built with **Node.js, TypeScript, Express, Prisma, and MariaDB**.

The backend provides authentication, role-based authorization, user management, department management, employee management, dashboard data, API validation, centralized error handling, security middleware, Swagger/OpenAPI documentation, and automated API tests.

---

## Features

- JWT authentication
- HTTP-only authentication cookie
- Role-based access control
- Admin and regular user roles
- User management
- Employee management
- Department management
- Dashboard API
- Password hashing with bcrypt
- Request validation with Zod
- Centralized error handling
- Prisma ORM
- MariaDB database
- Helmet security headers
- CORS configuration
- Swagger/OpenAPI API documentation
- Automated API testing with Vitest and Supertest
- Health-check endpoints
- RESTful API architecture

---

## Technology Stack

### Backend

- Node.js
- TypeScript
- Express 5
- Prisma 7
- MariaDB
- JWT
- bcrypt
- Zod
- Helmet
- CORS
- Cookie Parser
- Swagger UI
- OpenAPI

### Testing

- Vitest
- Supertest

---

## Architecture

The backend follows a layered architecture:

```text
Client
  │
  ▼
Express Routes
  │
  ▼
Middleware
  │
  ├── Authentication
  ├── Authorization
  └── Validation
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Repository
  │
  ▼
Prisma
  │
  ▼
MariaDB
```

### Responsibilities

**Routes**

Define API endpoints and middleware.

**Middleware**

Handles authentication, authorization, validation, and security-related request processing.

**Controllers**

Handle HTTP requests and responses.

**Services**

Contain business logic and application rules.

**Repositories**

Handle database access through Prisma.

**Prisma**

Provides ORM functionality and database access.

**MariaDB**

Stores application data.

---

## Project Structure

```text
src/
├── config/
│   ├── env.ts
│   └── swagger.ts
│
├── controllers/
│   ├── auth.controller.ts
│   ├── dashboard.controller.ts
│   ├── department.controller.ts
│   ├── employee.controller.ts
│   └── user.controller.ts
│
├── middleware/
│   ├── auth.ts
│   ├── errorHandler.ts
│   ├── notFound.ts
│   └── validate.ts
│
├── repositories/
│   ├── department.repository.ts
│   ├── employee.repository.ts
│   └── user.repository.ts
│
├── routes/
│   ├── auth.routes.ts
│   ├── dashboard.routes.ts
│   ├── department.routes.ts
│   ├── employee.routes.ts
│   └── user.routes.ts
│
├── services/
│   ├── auth.service.ts
│   ├── dashboard.service.ts
│   ├── department.service.ts
│   ├── employee.service.ts
│   └── user.service.ts
│
├── utils/
│   └── ...
│
├── app.ts
└── server.ts

prisma/
└── schema.prisma

tests/
├── auth/
├── authorization/
├── users/
├── departments/
├── employees/
├── dashboard/
├── security/
├── errors/
└── health/
```

---

# Requirements

Before running the project, install:

- Node.js
- npm
- MariaDB

Recommended:

```text
Node.js 20+
npm 10+
MariaDB 10.4+
```

---

# Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Navigate into the backend directory:

```bash
cd worksphere-backend
```

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

---

# Environment Configuration

Create a local `.env` file in the project root.

Example:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=worksphere

DATABASE_URL="mysql://root:@localhost:3306/worksphere"

JWT_SECRET=replace-with-a-long-random-secret

FRONTEND_URL=http://localhost:5173

TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=replace-with-test-password

TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=replace-with-test-password
```

> Never commit `.env` to Git.

Use `.env.example` to document the required environment variables without exposing real credentials.

---

# Database Setup

Make sure MariaDB is running.

Create the database:

```sql
CREATE DATABASE worksphere;
```

Generate Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

If the project already contains migrations, Prisma will apply the existing migrations.

You can also inspect the database using Prisma Studio:

```bash
npx prisma studio
```

---

# Running the Application

## Development

Start the development server:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

---

## Production Build

Build the TypeScript application:

```bash
npm run build
```

Start the compiled application:

```bash
npm start
```

---

# API Documentation

Swagger/OpenAPI documentation is available at:

```text
http://localhost:3000/api/docs
```

The Swagger documentation provides an interactive interface for viewing and testing the available API endpoints.

---

# Authentication

WorkSphere uses JWT authentication stored in an HTTP-only cookie.

Authentication cookie:

```text
worksphere_auth
```

The cookie is configured as HTTP-only and uses secure settings in production.

---

## Login

```http
POST /api/auth/login
```

Example request:

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

Successful authentication sets the authentication cookie.

---

## Get Current User

```http
GET /api/auth/me
```

Requires authentication.

---

## Logout

```http
POST /api/auth/logout
```

Requires authentication.

---

# Authorization

WorkSphere uses role-based access control.

Current roles:

| Role  |  ID |
| ----- | --: |
| ADMIN |   1 |
| USER  |   2 |

### ADMIN

Administrators can manage:

- Users
- Departments
- Employees
- Dashboard data

### USER

Regular users have restricted access and can access resources according to the authorization rules implemented by the API.

Users cannot perform administrative operations.

---

# API Endpoints

## Authentication

| Method | Endpoint           | Authentication |
| ------ | ------------------ | -------------- |
| POST   | `/api/auth/login`  | Public         |
| POST   | `/api/auth/logout` | Required       |
| GET    | `/api/auth/me`     | Required       |

---

## Users

| Method | Endpoint         | Access           |
| ------ | ---------------- | ---------------- |
| GET    | `/api/users`     | ADMIN            |
| POST   | `/api/users`     | ADMIN            |
| GET    | `/api/users/:id` | ADMIN / Own User |
| PUT    | `/api/users/:id` | ADMIN            |
| DELETE | `/api/users/:id` | ADMIN            |

Administrators cannot deactivate or delete their own account.

---

## Departments

| Method | Endpoint               | Access |
| ------ | ---------------------- | ------ |
| GET    | `/api/departments`     | ADMIN  |
| POST   | `/api/departments`     | ADMIN  |
| PUT    | `/api/departments/:id` | ADMIN  |
| DELETE | `/api/departments/:id` | ADMIN  |

Departments cannot be deleted while employees are assigned to them.

---

## Employees

| Method | Endpoint             | Access |
| ------ | -------------------- | ------ |
| GET    | `/api/employees`     | ADMIN  |
| POST   | `/api/employees`     | ADMIN  |
| PUT    | `/api/employees/:id` | ADMIN  |
| DELETE | `/api/employees/:id` | ADMIN  |

Employee rules include:

- Employee number must be unique.
- Each user can have only one employee record.
- An employee must belong to a department.
- The referenced user must exist.
- The referenced department must exist.

---

## Dashboard

```http
GET /api/dashboard
```

Requires authentication.

The dashboard endpoint provides aggregated application information used by the frontend.

---

# Health Checks

The application provides health-check endpoints for monitoring application and database availability.

Example:

```http
GET /api/health
```

The health endpoints are designed to verify that the application and database are operational without exposing sensitive information.

---

# Validation

Request validation is implemented using **Zod**.

Invalid requests return:

```http
400 Bad Request
```

Example response:

```json
{
  "message": "Validation failed",
  "errors": []
}
```

Validation prevents invalid data from reaching the service layer.

---

# Error Handling

The application uses centralized error handling.

Common HTTP responses include:

| Status | Meaning                                  |
| -----: | ---------------------------------------- |
|    200 | Request successful                       |
|    201 | Resource created                         |
|    204 | Successful request with no response body |
|    400 | Invalid request                          |
|    401 | Authentication required or invalid       |
|    403 | Access denied                            |
|    404 | Resource not found                       |
|    409 | Conflict                                 |
|    500 | Internal server error                    |

Common business conflicts include:

- Duplicate email
- Duplicate employee number
- Duplicate department name
- User already assigned to an employee
- Attempting to delete a department containing employees
- Attempting to deactivate or delete the currently authenticated administrator

---

# Security

The backend includes several security controls.

### HTTP Security Headers

Helmet is enabled to add common security-related HTTP headers.

### Authentication Cookie

JWT authentication is stored in an HTTP-only cookie.

### Password Hashing

Passwords are hashed using bcrypt.

Passwords are never returned through API responses.

### JWT Protection

JWT tokens are not returned in normal API response bodies.

### Role-Based Authorization

Protected administrative operations require the appropriate role.

### CORS

Cross-origin requests are restricted through the configured frontend URL.

### Request Validation

Zod validates incoming request payloads.

### Error Handling

Internal errors are handled centrally to prevent unnecessary internal implementation details from being exposed to clients.

### Sensitive Data Protection

Sensitive fields such as password hashes are excluded from API responses.

---

# Database Schema

The primary entities are:

```text
Role
 │
 └── User
      │
      └── Employee
             │
             └── Department
```

Main relationships:

- One Role → Many Users
- One User → Zero or One Employee
- One Department → Many Employees
- One Employee → One User
- One Employee → One Department

---

# Testing

The project uses:

- Vitest
- Supertest

Run the complete test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The current test suite covers:

- Authentication
- Authorization
- User management
- Regular-user access
- Department management
- Employee management
- Dashboard
- Security configuration
- Response data protection
- Error handling
- Health checks

Current test status:

```text
Test Files: 11 passed
Tests:      70 passed
```

---

# NPM Scripts

| Command                  | Description                |
| ------------------------ | -------------------------- |
| `npm run dev`            | Start development server   |
| `npm run build`          | Compile TypeScript         |
| `npm start`              | Start compiled application |
| `npm test`               | Run test suite             |
| `npm run test:watch`     | Run tests in watch mode    |
| `npx prisma generate`    | Generate Prisma Client     |
| `npx prisma migrate dev` | Run development migrations |
| `npx prisma studio`      | Open Prisma Studio         |

---

# Development Workflow

Typical development workflow:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Run tests before committing:

```bash
npm test
```

Build the application before deployment:

```bash
npm run build
```

---

---

# License

This project is intended for private/internal use.

Add an appropriate license if the project will be distributed publicly.

---

# Author

WorkSphere Backend

Built with:

```text
Node.js
TypeScript
Express
Prisma
MariaDB
Jenkins webhook test
```
