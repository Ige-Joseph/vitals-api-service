import swaggerJSDoc from "swagger-jsdoc";
import { waitlistDocs } from "../modules/waitlist/waitlist.docs";
import { contactDocs } from "../modules/contact/contact.docs";

const appUrl =
  process.env.APP_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://vitals-api-service.fly.dev"
    : "http://localhost:3000");

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Waitlist & Contact API",
      version: "1.0.0",
      description: "API documentation for waitlist and contact form endpoints",
    },
    servers: [
      {
        url: appUrl,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Local development server",
      },
    ],
    paths: {
      ...waitlistDocs,
      ...contactDocs,
    },
    components: {
      schemas: {
        WaitlistRequest: {
          type: "object",
          required: ["email", "marketingConsent"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            marketingConsent: {
              type: "boolean",
              example: true,
            },
          },
        },
        ContactRequest: {
          type: "object",
          required: ["name", "email", "subject", "message"],
          properties: {
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            subject: {
              type: "string",
              example: "Partnership inquiry",
            },
            message: {
              type: "string",
              example: "Hello, I would like to know more about your service.",
            },
          },
        },
      },
    },
  },
  apis: [],
});