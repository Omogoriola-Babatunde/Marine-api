export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Marine API",
    version: "1.0.0",
    description:
      "Marine cargo insurance quotes & policies, with PDF certificate of insurance. Demo build — no auth.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Quote", description: "Insurance quotes & premium calculation" },
    { name: "Policy", description: "Policies & certificate generation" },
    { name: "Health" },
  ],
  components: {
    schemas: {
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
          "createdAt",
        ],
      },
      QuoteInput: {
        type: "object",
        required: ["classType", "cargoType", "cargoValue", "origin", "destination"],
        properties: {
          classType: { type: "string", enum: ["A", "B", "C"], example: "B" },
          cargoType: { type: "string", maxLength: 100, example: "electronics" },
          cargoValue: { type: "number", format: "double", minimum: 0.01, example: 50000 },
          origin: { type: "string", maxLength: 100, example: "Lagos" },
          destination: { type: "string", maxLength: 100, example: "Hamburg" },
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
          customername: { type: "string", maxLength: 100 },
          status: { type: "string", example: "active" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      PolicyInput: {
        type: "object",
        required: ["quoteId", "customername"],
        properties: {
          quoteId: { type: "string", format: "uuid", description: "ID of an existing Quote" },
          customername: { type: "string", maxLength: 100, example: "Acme Co" },
        },
      },
      PolicyResponse: {
        type: "object",
        properties: {
          policy: { $ref: "#/components/schemas/Policy" },
          certificatePath: {
            type: "string",
            description: "Absolute filesystem path of the generated PDF",
          },
        },
      },
      QuoteList: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Quote" } },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              pages: { type: "integer" },
            },
          },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          errors: { type: "array", items: { type: "string" } },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
    responses: {
      BadRequest: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidationError" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Forbidden: {
        description: "Access denied",
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
        responses: {
          200: {
            description: "OK",
            content: { "text/plain": { example: "Marine API is running!" } },
          },
        },
      },
    },
    "/api/quote": {
      post: {
        tags: ["Quote"],
        summary: "Create a quote",
        description: "Calculates premium based on classType (A=10%, B=0.7%, C=0.5%) and persists.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/QuoteInput" } },
          },
        },
        responses: {
          200: {
            description: "Quote created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Quote" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      get: {
        tags: ["Quote"],
        summary: "List quotes (paginated)",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          200: {
            description: "Paginated list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/QuoteList" } },
            },
          },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/policy": {
      post: {
        tags: ["Policy"],
        summary: "Issue a policy and generate certificate PDF",
        description:
          "Looks up the Quote by `quoteId`, creates a Policy with a UUID-suffixed policyNumber, and renders a PDF certificate via Puppeteer.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PolicyInput" } },
          },
        },
        responses: {
          200: {
            description: "Policy created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PolicyResponse" } },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/policy/certificate/{policyNumber}": {
      get: {
        tags: ["Policy"],
        summary: "Download policy certificate PDF",
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
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
  },
};
