export const contactDocs = {
  "/api/contact": {
    post: {
      tags: ["Contact"],
      summary: "Submit a contact form message",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
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
                  example: "Partnership Inquiry",
                },
                message: {
                  type: "string",
                  example: "Hello, I would like to know more about your platform.",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Contact message submitted successfully",
        },
        400: {
          description: "Validation failed",
        },
        429: {
          description: "Too many requests",
        },
        500: {
          description: "Internal server error",
        },
      },
    },
  },
};