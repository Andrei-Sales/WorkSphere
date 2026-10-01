import type { OpenAPIV3 } from "openapi-types";

const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "WorkSphere API",
    version: "1.0.0",
    description:
      "REST API for the WorkSphere employee and user management system.",
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],

  tags: [
    {
      name: "Authentication",
      description: "Authentication and session management",
    },
    {
      name: "Users",
      description: "User management",
    },
    {
      name: "Departments",
      description: "Department management",
    },
    {
      name: "Employees",
      description: "Employee management",
    },
    {
      name: "Dashboard",
      description: "Dashboard information",
    },
    {
      name: "Health",
      description: "Application health checks",
    },
  ],

  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "worksphere_auth",
        description: "JWT authentication cookie issued after successful login.",
      },
    },

    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "admin@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "your-password",
          },
        },
      },

      User: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1,
          },
          email: {
            type: "string",
            format: "email",
            example: "admin@example.com",
          },
          firstName: {
            type: "string",
            example: "John",
          },
          lastName: {
            type: "string",
            example: "Doe",
          },
          roleId: {
            type: "integer",
            example: 1,
          },
          status: {
            type: "string",
            example: "ACTIVE",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      Department: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1,
          },
          name: {
            type: "string",
            example: "Information Technology",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      Employee: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1,
          },
          employeeNumber: {
            type: "string",
            example: "EMP-0001",
          },
          firstName: {
            type: "string",
            example: "John",
          },
          lastName: {
            type: "string",
            example: "Doe",
          },
          position: {
            type: "string",
            example: "Software Engineer",
          },
          hireDate: {
            type: "string",
            format: "date-time",
          },
          status: {
            type: "string",
            example: "ACTIVE",
          },
          userId: {
            type: "integer",
            example: 1,
          },
          departmentId: {
            type: "integer",
            example: 1,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      ErrorResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Resource not found",
          },
          errors: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
    },
  },

  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login",
        description:
          "Authenticates a user and creates an HTTP-only JWT cookie.",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Login successful",
          },

          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },

          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },

          "403": {
            description: "User account is inactive",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout",
        security: [{ cookieAuth: [] }],

        responses: {
          "200": {
            description: "Logout successful",
          },

          "401": {
            description: "Authentication required",
          },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current authenticated user",
        security: [{ cookieAuth: [] }],

        responses: {
          "200": {
            description: "Current user",
          },

          "401": {
            description: "Authentication required",
          },
        },
      },
    },

    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users",
        security: [{ cookieAuth: [] }],

        responses: {
          "200": {
            description: "Users retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },
        },
      },

      post: {
        tags: ["Users"],
        summary: "Create user",
        security: [{ cookieAuth: [] }],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "email",
                  "password",
                  "firstName",
                  "lastName",
                  "roleId",
                ],

                properties: {
                  email: {
                    type: "string",
                    format: "email",
                  },

                  password: {
                    type: "string",
                    format: "password",
                  },

                  firstName: {
                    type: "string",
                  },

                  lastName: {
                    type: "string",
                  },

                  roleId: {
                    type: "integer",
                    example: 2,
                  },
                },
              },
            },
          },
        },

        responses: {
          "201": {
            description: "User created successfully",
          },

          "400": {
            description: "Validation failed",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "409": {
            description: "Email already exists",
          },
        },
      },
    },

    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        responses: {
          "200": {
            description: "User retrieved successfully",
          },

          "400": {
            description: "Invalid user ID",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Access denied",
          },

          "404": {
            description: "User not found",
          },
        },
      },

      put: {
        tags: ["Users"],
        summary: "Update user",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  email: {
                    type: "string",
                    format: "email",
                  },

                  firstName: {
                    type: "string",
                  },

                  lastName: {
                    type: "string",
                  },

                  roleId: {
                    type: "integer",
                  },

                  status: {
                    type: "string",
                    example: "ACTIVE",
                  },
                },
              },
            },
          },
        },

        responses: {
          "200": {
            description: "User updated successfully",
          },

          "400": {
            description: "Validation failed",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "404": {
            description: "User not found",
          },

          "409": {
            description: "Email already exists",
          },
        },
      },

      delete: {
        tags: ["Users"],
        summary: "Delete user",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        responses: {
          "204": {
            description: "User deleted successfully",
          },

          "400": {
            description: "Cannot delete own account",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "404": {
            description: "User not found",
          },
        },
      },
    },

    "/api/departments": {
      get: {
        tags: ["Departments"],
        summary: "Get all departments",
        security: [{ cookieAuth: [] }],

        responses: {
          "200": {
            description: "Departments retrieved successfully",

            content: {
              "application/json": {
                schema: {
                  type: "array",

                  items: {
                    $ref: "#/components/schemas/Department",
                  },
                },
              },
            },
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },
        },
      },

      post: {
        tags: ["Departments"],
        summary: "Create department",
        security: [{ cookieAuth: [] }],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: ["name"],

                properties: {
                  name: {
                    type: "string",
                    example: "Information Technology",
                  },
                },
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Department created successfully",
          },

          "400": {
            description: "Validation failed",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "409": {
            description: "Department already exists",
          },
        },
      },
    },

    "/api/departments/{id}": {
      put: {
        tags: ["Departments"],
        summary: "Update department",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: ["name"],

                properties: {
                  name: {
                    type: "string",
                    example: "Information Technology",
                  },
                },
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Department updated successfully",
          },

          "400": {
            description: "Validation failed",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "404": {
            description: "Department not found",
          },

          "409": {
            description: "Department already exists",
          },
        },
      },

      delete: {
        tags: ["Departments"],
        summary: "Delete department",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        responses: {
          "204": {
            description: "Department deleted successfully",
          },

          "400": {
            description: "Invalid department ID",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "404": {
            description: "Department not found",
          },

          "409": {
            description: "Department has assigned employees",
          },
        },
      },
    },

    "/api/employees": {
      get: {
        tags: ["Employees"],
        summary: "Get all employees",
        security: [{ cookieAuth: [] }],

        responses: {
          "200": {
            description: "Employees retrieved successfully",

            content: {
              "application/json": {
                schema: {
                  type: "array",

                  items: {
                    $ref: "#/components/schemas/Employee",
                  },
                },
              },
            },
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },
        },
      },

      post: {
        tags: ["Employees"],
        summary: "Create employee",
        security: [{ cookieAuth: [] }],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "employeeNumber",
                  "firstName",
                  "lastName",
                  "position",
                  "hireDate",
                  "userId",
                  "departmentId",
                ],

                properties: {
                  employeeNumber: {
                    type: "string",
                    example: "EMP-0001",
                  },

                  firstName: {
                    type: "string",
                    example: "John",
                  },

                  lastName: {
                    type: "string",
                    example: "Doe",
                  },

                  position: {
                    type: "string",
                    example: "Software Engineer",
                  },

                  hireDate: {
                    type: "string",
                    format: "date",
                    example: "2026-01-15",
                  },

                  status: {
                    type: "string",
                    example: "ACTIVE",
                  },

                  userId: {
                    type: "integer",
                    example: 2,
                  },

                  departmentId: {
                    type: "integer",
                    example: 1,
                  },
                },
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Employee created successfully",
          },

          "400": {
            description: "Validation failed",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "404": {
            description: "User or department not found",
          },

          "409": {
            description: "Employee number or user assignment already exists",
          },
        },
      },
    },

    "/api/employees/{id}": {
      get: {
        tags: ["Employees"],
        summary: "Get employee by ID",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        responses: {
          "200": {
            description: "Employee retrieved successfully",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "404": {
            description: "Employee not found",
          },
        },
      },

      put: {
        tags: ["Employees"],
        summary: "Update employee",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Employee",
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Employee updated successfully",
          },

          "400": {
            description: "Validation failed",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "404": {
            description: "Employee not found",
          },

          "409": {
            description: "Employee number already exists",
          },
        },
      },

      delete: {
        tags: ["Employees"],
        summary: "Delete employee",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        responses: {
          "204": {
            description: "Employee deleted successfully",
          },

          "401": {
            description: "Authentication required",
          },

          "403": {
            description: "Admin access required",
          },

          "404": {
            description: "Employee not found",
          },
        },
      },
    },

    "/api/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard information",
        security: [{ cookieAuth: [] }],

        responses: {
          "200": {
            description: "Dashboard data retrieved successfully",
          },

          "401": {
            description: "Authentication required",
          },
        },
      },
    },

    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Application health check",

        responses: {
          "200": {
            description: "Application is healthy",
          },
        },
      },
    },

    "/api/health/db": {
      get: {
        tags: ["Health"],
        summary: "Database health check",

        responses: {
          "200": {
            description: "Database connection is healthy",
          },

          "500": {
            description: "Database connection failed",
          },
        },
      },
    },
  },
};

export default swaggerDocument;
