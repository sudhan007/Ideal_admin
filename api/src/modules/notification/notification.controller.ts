import { Elysia } from "elysia";
import { batchWhatsappNotification, sendNotificationAll } from "./notification.service";
import { sendNotificationallDto, batchWhatsappNotificationDto } from "./notification.model";

export const notificationController = new Elysia({
    prefix: '/notification',
    detail: {
        tags: ["Notification"]
    }
})
    .post("/all", sendNotificationAll, sendNotificationallDto)
    .post("/whatsapp/batch", batchWhatsappNotification, batchWhatsappNotificationDto)