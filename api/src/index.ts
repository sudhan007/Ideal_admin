import { Elysia } from "elysia";
import { connectDB } from "@lib/config/db.config";
import { APP_CONSTANTS } from "@lib/config/env.config";
import { baseController } from "./modules";
import { swaggerConfig } from "@lib/config/swagger.config";
import { loggerConfig } from "@lib/config/logger.config";
import cors from "@elysiajs/cors";

const PORT = APP_CONSTANTS.PORT

await connectDB();

const app = new Elysia()
    .use(cors())
    .use(swaggerConfig())
    .use(loggerConfig())
    .use(baseController)
    .listen(PORT)

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

console.log(`Swagger docs at http://${app.server?.hostname}:${app.server?.port}/docs`)