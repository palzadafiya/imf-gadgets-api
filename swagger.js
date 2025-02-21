const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Phoenix: IMF Gadget API",
      version: "1.0.0",
      description: "API documentation for the Phoenix IMF Gadget API",
    },
    servers: [
      {
        url: "https://imf-gadgets-api-2hf3.onrender.com:" + process.env.PORT,
        description: "Local development server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Update this path based on your routes folder
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
