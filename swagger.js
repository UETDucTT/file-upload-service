module.exports = {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "File Upload Service",
    contact: {
      name: "Trần Tiến Đức",
      email: "trantienduc10@gmail.com"
    },
  },
  servers: [
    {
      url: "http://localhost:8081",
      description: "Local server"
    }
  ],
  security: [
    {
      ApiKeyAuth: []
    }
  ],
  tags: [
    {
      name: "Check"
    },
    {
      name: "Upload"
    }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Check"],
        description: "Check server",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/checkHealth"
                }
              }
            }
          }
        }
      }
    },
    "/upload": {
      post: {
        tags: ["Upload"],
        description: "Upload single file to server",
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: "object",
                properties: {
                  resource: {
                    type: "string",
                    format: "binary",
                  }
                }
              }
            }
          },
          required: true
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UploadSuccess"
                }
              }
            }
          }
        }
      }
    },
  },
  components: {
    schemas: {
      checkHealth: {
        type: "object",
        properties: {
          ok: {
            type: "boolean",
            example: true,
          },
        }
      },
      UploadSuccess: {
        type: "object",
        properties: {
          container: {
            type: "string",
          },
          blob: {
            type: "string",
          },
          size: {
            type: "number",
          },
          mimetype: {
            type: "string",
            example: "image/jpg"
          },
          url: {
            type: "string",
          }
        }
      },
    },
  }
};