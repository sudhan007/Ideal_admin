import { Elysia } from "elysia";
import { connectDB } from "@lib/config/db.config";
import { APP_CONSTANTS } from "@lib/config/env.config";
import { baseController } from "./modules";
import { swaggerConfig } from "@lib/config/swagger.config";
import { loggerConfig } from "@lib/config/logger.config";
import cors from "@elysiajs/cors";
import { sendNotification } from "@lib/utils/notification";

const PORT = APP_CONSTANTS.PORT

await connectDB();

const app = new Elysia()
    .use(cors())
    .use(swaggerConfig())
    .use(loggerConfig())
    .use(baseController)
    .listen(PORT)

// await sendNotification("cF82Gw4JTTCfUlr4G, St_Z0:APA91bH8SjC55HgQar4LLJUnU_ZkqAfh9cDvH_Xa2gVqCUN-ghMblqg75nHQtEMywpiO0Atk5IHaufV981GBS4lrWDLCSCP1EaH6jIJf1hdMdBIIGkIh5JI", "test", "test")

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

console.log(`Swagger docs at http://${app.server?.hostname}:${app.server?.port}/docs`)