import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0', // Specify the OpenAPI version
    info: {
      title: 'Coffee Craft Service API', // Title of your API
      version: '1.0.0', // Version of your API
      description: 'API documentation for the Coffee Craft backend service, managing products, orders, users, and more.',
      // You can add contact, license info here if needed
      // contact: {
      //   name: 'API Support',
      //   url: 'http://www.example.com/support',
      //   email: 'support@example.com',
      // },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`, // Adjust based on your environment
        description: 'Development server',
      },
      // Add other servers like staging or production if applicable
    ],
    // Optional: Define security schemes if you use JWT/OAuth etc.
    // components: {
    //   securitySchemes: {
    //     bearerAuth: { // Or cookieAuth, etc.
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT',
    //     },
    //     // cookieAuth: {
    //     //   type: 'apiKey',
    //     //   in: 'cookie',
    //     //   name: 'access_token' // Name of your cookie
    //     // }
    //   },
    // },
    // security: [ // Apply security globally or per-path
    //   {
    //     bearerAuth: [],
    //     // cookieAuth: []
    //   },
    // ],
  },
  // Path to the API docs files (your route files with JSDoc comments)
  // Use glob patterns to include multiple files/directories
  apis: ['./src/routes/*.ts'], // Adjust the pattern to match your route file locations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
