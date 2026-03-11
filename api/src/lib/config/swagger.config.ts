import swagger from "@elysiajs/swagger";

export const swaggerConfig = () => {
  return swagger(
    {
      path: "/docs",
      exclude: ["/docs", "/docs/json"],
      theme: "dark",
      documentation: {
        servers: [
          {
            url: "http://localhost:8000/"
          },
          {
            url: "https://ideal-admin.onrender.com"
          },
          {
            url: "http://13.201.119.4"
          },
          {
            url: "https://api.indiancrackers.shop"
          },
          {
            url: "https://panoptic-pauline-demiurgic.ngrok-free.dev"
          }
        ],
        info: {
          title: "Ideal Academy API",
          version: "1.0.0",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              scheme: "bearer",
              type: "http",
              bearerFormat: "JWT",
            },
          },
        },
      },
    }
  )
} 