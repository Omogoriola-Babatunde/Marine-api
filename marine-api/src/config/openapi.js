export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Marine API",
    version: "1.0.0",
    description:
      "Marine cargo insurance quotes & policies with PDF certificate generation, " +
      "admin approval workflows, audit log, and production reporting. " +
      "Most endpoints require a Bearer JWT obtained from `POST /api/auth/login`.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health" },
    { name: "Auth", description: "Registration, login, password reset" },
    { name: "Quote", description: "Insurance quotes & premium calculation" },
    { name: "Policy", description: "Policy issuance, approval, certificates" },
    { name: "Reports", description: "Production reports (admin)" },
    { name: "Audit", description: "Audit log (admin)" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT obtained from `POST /api/auth/login`",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      ValidationError: {
        type: "object",
        properties: {
          errors: { type: "array", items: { type: "string" } },
        },
      },
      Role: { type: "string", enum: ["ADMIN", "STAFF", "USER"] },
      QuoteStatus: { type: "string", enum: ["GENERATED", "CONVERTED", "EXPIRED"] },
      PolicyStatus: {
        type: "string",
        enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
      },
      TransactionType: { type: "string", enum: ["CREDIT", "DEBIT"] },

      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/Role" },
          classARate: { type: "number", format: "double" },
          classBRate: { type: "number", format: "double" },
          wallet: { type: "number", format: "double" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["fullName", "email", "password"],
        properties: {
          fullName: { type: "string", maxLength: 100, example: "Alice Lee" },
          email: { type: "string", format: "email", maxLength: 200, example: "alice@example.com" },
          password: { type: "string", minLength: 8, example: "correct-horse-battery" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "alice@example.com" },
          password: { type: "string", example: "correct-horse-battery" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", description: "Bearer JWT" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      ForgotPasswordInput: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", example: "alice@example.com" },
        },
      },

      Quote: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          classType: { type: "string", enum: ["A", "B", "C"] },
          cargoType: { type: "string", maxLength: 100 },
          cargoValue: { type: "number", format: "double", minimum: 0.01 },
          origin: { type: "string", maxLength: 100 },
          destination: { type: "string", maxLength: 100 },
          premium: { type: "number", format: "double" },
          status: { $ref: "#/components/schemas/QuoteStatus" },
          createdById: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "classType",
          "cargoType",
          "cargoValue",
          "origin",
          "destination",
          "premium",
          "status",
          "createdAt",
        ],
      },
      QuoteInput: {
        type: "object",
        required: ["classType", "cargoType", "cargoValue", "origin", "destination"],
        properties: {
          classType: { type: "string", enum: ["A", "B", "C"], example: "B" },
          cargoType: { type: "string", maxLength: 100, example: "electronics" },
          cargoValue: {
            type: "number",
            format: "double",
            minimum: 0.01,
            example: 50000,
          },
          origin: { type: "string", maxLength: 100, example: "Lagos" },
          destination: { type: "string", maxLength: 100, example: "Hamburg" },
        },
      },
      QuoteList: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Quote" } },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },

      PolicyList: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Policy" } },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },

      Policy: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          policyNumber: {
            type: "string",
            pattern: "^POL-[0-9a-fA-F-]{36}$",
            example: "POL-b0fa0b26-f598-42d7-b65b-87c547eb4d38",
          },
          quoteId: { type: "string", format: "uuid" },
          customerName: { type: "string", maxLength: 100 },
          status: { $ref: "#/components/schemas/PolicyStatus" },
          proformaInvoice: { type: "string", nullable: true },
          mode: { type: "string", nullable: true },
          currency: { type: "string", nullable: true },
          invoiceValue: { type: "number", format: "double", nullable: true },
          exchangeRate: { type: "number", format: "double", nullable: true },
          startDate: { type: "string", format: "date-time", nullable: true },
          endDate: { type: "string", format: "date-time", nullable: true },
          naicomId: { type: "string", nullable: true },
          issuedById: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      PolicyInput: {
        type: "object",
        required: ["quoteId", "customerName"],
        properties: {
          quoteId: {
            type: "string",
            format: "uuid",
            description: "ID of an existing Quote in GENERATED status",
          },
          customerName: { type: "string", maxLength: 100, example: "Acme Co" },
        },
      },
      PolicyCreateResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Policy submitted for approval" },
          policy: { $ref: "#/components/schemas/Policy" },
        },
      },
      PolicyApproveResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Policy approved" },
          policy: { $ref: "#/components/schemas/Policy" },
          certificatePath: {
            type: "string",
            nullable: true,
            description: "Absolute filesystem path of the generated PDF",
          },
        },
      },

      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          action: { type: "string", example: "APPROVE_POLICY" },
          description: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      AuditLogList: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/AuditLog" } },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },

      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          pages: { type: "integer" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: {
              oneOf: [
                { $ref: "#/components/schemas/ValidationError" },
                { $ref: "#/components/schemas/Error" },
              ],
            },
          },
        },
      },
      Unauthorized: {
        description: "Missing or invalid token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Forbidden: {
        description: "Authenticated but lacks required role",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Conflict: {
        description: "Resource conflict (e.g. email already registered)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      TooManyRequests: {
        description: "Rate limit exceeded",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ServerError: {
        description: "Internal server error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Liveness check",
        security: [],
        responses: {
          200: {
            description: "OK",
            content: { "text/plain": { example: "Marine API is running!" } },
          },
        },
      },
    },

    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new USER account",
        description:
          "Self-registration always creates a USER role. ADMIN/STAFF accounts must be provisioned out-of-band. Rate limited to 20 requests / 15 min.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } },
          },
        },
        responses: {
          201: {
            description: "User created (password hash stripped from response)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
          429: { $ref: "#/components/responses/TooManyRequests" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Exchange credentials for a Bearer JWT",
        description: "Rate limited to 20 requests / 15 min.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } },
          },
        },
        responses: {
          200: {
            description: "JWT + user profile",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          429: { $ref: "#/components/responses/TooManyRequests" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset link",
        description:
          "Always returns the same generic message regardless of whether the email exists (no user-enumeration). Rate limited to 5 requests / hour.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Generic acknowledgement",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },

    "/api/quote": {
      post: {
        tags: ["Quote"],
        summary: "Create a quote",
        description: "Premium = cargoValue × rate(classType). A=10%, B=0.7%, C=0.5%.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/QuoteInput" } },
          },
        },
        responses: {
          201: {
            description: "Quote created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Quote" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      get: {
        tags: ["Quote"],
        summary: "List quotes (paginated, ADMIN/STAFF)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["GENERATED", "CONVERTED", "EXPIRED"] },
          },
        ],
        responses: {
          200: {
            description: "Paginated list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/QuoteList" } },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/quote/mine": {
      get: {
        tags: ["Quote"],
        summary: "List the authenticated user's own quotes (paginated)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["GENERATED", "CONVERTED", "EXPIRED"] },
          },
        ],
        responses: {
          200: {
            description: "Paginated list of your quotes",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/QuoteList" } },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/quote/pending": {
      get: {
        tags: ["Quote"],
        summary: "List pending (GENERATED) quotes (ADMIN)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Array of pending quotes",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Quote" } },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/quote/approved": {
      get: {
        tags: ["Quote"],
        summary: "List approved (CONVERTED) quotes (ADMIN/STAFF)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Array of approved quotes",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Quote" } },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/quote/approve/{id}": {
      patch: {
        tags: ["Quote"],
        summary: "Approve a quote (ADMIN, audit only)",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Approved quote",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Quote" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/quote/reject/{id}": {
      patch: {
        tags: ["Quote"],
        summary: "Reject a quote (ADMIN, sets status=EXPIRED)",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Rejected quote",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Quote" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/quote/{id}": {
      patch: {
        tags: ["Quote"],
        summary: "Edit a GENERATED quote (creator or ADMIN/STAFF)",
        description:
          "Partial update. Premium is recomputed from classType × cargoValue server-side. Only allowed while the quote is GENERATED; once CONVERTED or EXPIRED returns 409.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  classType: { type: "string", enum: ["A", "B", "C"] },
                  cargoType: { type: "string", maxLength: 100 },
                  cargoValue: { type: "number", format: "double", exclusiveMinimum: 0 },
                  origin: { type: "string", maxLength: 100 },
                  destination: { type: "string", maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated quote",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Quote" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      delete: {
        tags: ["Quote"],
        summary: "Delete a GENERATED quote (ADMIN only)",
        description: "Only allowed while the quote is GENERATED; otherwise returns 409.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          204: { description: "Deleted" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/policy": {
      post: {
        tags: ["Policy"],
        summary: "Issue a policy from an existing quote (ADMIN/STAFF)",
        description:
          "Creates a PENDING_APPROVAL policy and atomically transitions the quote to CONVERTED. Certificate PDF is generated later, on approval.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PolicyInput" } },
          },
        },
        responses: {
          201: {
            description: "Policy submitted for approval",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PolicyCreateResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      get: {
        tags: ["Policy"],
        summary: "List policies (paginated, ADMIN/STAFF)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
            },
          },
        ],
        responses: {
          200: {
            description: "Paginated list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PolicyList" } },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/policy/mine": {
      get: {
        tags: ["Policy"],
        summary: "List the authenticated user's own policies (paginated)",
        description: "Returns policies where the authenticated user is the issuer.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
            },
          },
        ],
        responses: {
          200: {
            description: "Paginated list of your policies",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PolicyList" } },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/policy/pending": {
      get: {
        tags: ["Policy"],
        summary: "List policies awaiting approval (ADMIN)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Array of pending policies",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Policy" } },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/policy/approved": {
      get: {
        tags: ["Policy"],
        summary: "List APPROVED policies (ADMIN/STAFF)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Array of approved policies",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Policy" } },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/policy/approve/{id}": {
      patch: {
        tags: ["Policy"],
        summary: "Approve a policy (ADMIN)",
        description:
          "Atomically debits the issuer's wallet by the quote's premium, inserts a DEBIT WalletTransaction, and sets policy status APPROVED. Then generates the PDF certificate.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Approved policy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PolicyApproveResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/policy/reject/{id}": {
      patch: {
        tags: ["Policy"],
        summary: "Reject a policy (ADMIN)",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Rejected policy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    policy: { $ref: "#/components/schemas/Policy" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/policy/certificate/{policyNumber}": {
      get: {
        tags: ["Policy"],
        summary: "Download policy certificate PDF",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "policyNumber",
            in: "path",
            required: true,
            schema: { type: "string", pattern: "^POL-[0-9a-fA-F-]{36}$" },
            example: "POL-b0fa0b26-f598-42d7-b65b-87c547eb4d38",
          },
        ],
        responses: {
          200: {
            description: "PDF stream",
            content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/reports/production": {
      get: {
        tags: ["Reports"],
        summary: "Download production report as XLSX (ADMIN)",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "startDate",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
            example: "2026-01-01",
          },
          {
            name: "endDate",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
            example: "2026-12-31",
          },
        ],
        responses: {
          200: {
            description: "XLSX file",
            content: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/audit": {
      get: {
        tags: ["Audit"],
        summary: "List audit log entries (ADMIN, paginated)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
          },
        ],
        responses: {
          200: {
            description: "Paginated audit log",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AuditLogList" } },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/user": {
      get: {
        tags: ["User"],
        summary: "List users (ADMIN, paginated)",
        description: "Returns id, fullName, email, and role. No password, wallet, or rates.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
          { name: "role", in: "query", schema: { $ref: "#/components/schemas/Role" } },
        ],
        responses: {
          200: {
            description: "Paginated list of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          fullName: { type: "string" },
                          email: { type: "string", format: "email" },
                          role: { $ref: "#/components/schemas/Role" },
                        },
                      },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/user/{id}/role": {
      patch: {
        tags: ["User"],
        summary: "Change a user's role (ADMIN)",
        description: "Cannot change your own role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: { role: { $ref: "#/components/schemas/Role" } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    fullName: { type: "string" },
                    email: { type: "string", format: "email" },
                    role: { $ref: "#/components/schemas/Role" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/wallet/balance": {
      get: {
        tags: ["Wallet"],
        summary: "Get the authenticated user's wallet balance",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Wallet info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    fullName: { type: "string" },
                    wallet: { type: "number", format: "double" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/wallet/topup": {
      post: {
        tags: ["Wallet"],
        summary: "Credit a user's wallet (ADMIN)",
        description:
          "Atomically increments the target user's wallet and inserts a CREDIT WalletTransaction.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "amount"],
                properties: {
                  userId: { type: "string", format: "uuid" },
                  amount: { type: "number", format: "double", exclusiveMinimum: 0 },
                  description: { type: "string", maxLength: 200 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Wallet topped up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        fullName: { type: "string" },
                        role: { type: "string" },
                        wallet: { type: "number", format: "double" },
                      },
                    },
                    transaction: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        amount: { type: "number", format: "double" },
                        type: { type: "string", enum: ["CREDIT", "DEBIT"] },
                        description: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
  },
};
