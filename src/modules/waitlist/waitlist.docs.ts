export const waitlistDocs = {
  "/api/waitlist": {
    post: {
      tags: ["Waitlist"],
      summary: "Add a user to the waitlist",
      description:
        "Creates a new waitlist entry, syncs the user to Brevo for campaign readiness, and sends a confirmation email.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
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
                  description: "User agreed to receive product updates by email.",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "User added to waitlist successfully",
        },
        200: {
          description: "User already exists in waitlist",
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

  "/api/waitlist/stats": {
    get: {
      tags: ["Waitlist"],
      summary: "Get waitlist statistics",
      description: "Returns total signups and today's signups.",
      responses: {
        200: {
          description: "Waitlist stats fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: true,
                  },
                  message: {
                    type: "string",
                    example: "Waitlist stats fetched successfully.",
                  },
                  data: {
                    type: "object",
                    properties: {
                      totalSignups: {
                        type: "number",
                        example: 120,
                      },
                      signupsToday: {
                        type: "number",
                        example: 8,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        500: {
          description: "Internal server error",
        },
      },
    },
  },
};