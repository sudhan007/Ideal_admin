import { t } from "elysia";

export const sendNotificationallDto = {
    body: t.Object({
        title: t.String(),
        body: t.String(),
        // image: t.Optional(t.File({ type: "image/*" })),
    }),
    detail: {
        summary: "Send Notification to all",
        description: "Send Notification to all",
    }
};
export const batchWhatsappNotificationDto = {
    body: t.Object({
        batchId: t.String(),
        templateName: t.String(),
        parameters: t.Array(t.String()),
        sendToStudent: t.Optional(t.Boolean()),
    }),
    detail: {
        summary: "Send Batch WhatsApp notification to all",
        description: "Send Batch WhatsApp notification to all students/parents in the selected batch using the specified template.",
    }
};
export type SendNotificationallSchema = typeof sendNotificationallDto.body.static
export type batchNotficationSchema = typeof batchWhatsappNotificationDto.body.static