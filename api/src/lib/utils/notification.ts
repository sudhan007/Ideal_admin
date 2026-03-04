import { admin } from "./firebase";

export async function sendNotification(
    token: string,
    title: string,
    body: string
) {
    try {
        const message = {
            notification: {
                title,
                body,
            },
            token,
        };

        const response = await admin.messaging().send(message);
        console.log("Notification sent:", response);
        return {
            ok: true,
            messageId: response,
        };
    } catch (error: any) {
        console.error(" Error sending notification:", error);
        return {
            ok: false,
            error: error.message,
        };
    }
}
export async function sendNotificationToAllStudents(
    title: string,
    body: string,
) {
    try {
        const message = {
            notification: {
                title,
                body,
            },
            topic: "students"
        };

        const response = await admin.messaging().send(message);

        return {
            ok: true,
            messageId: response,
        };
    } catch (error: any) {
        console.error("Error sending notification to all students:", error);
        return {
            ok: false,
            error: error.message,
        };
    }
}
export async function subscribeStudentToTopic(fcmToken: string) {
    try {
        const response = await admin.messaging().subscribeToTopic(fcmToken, "students");

        return {
            ok: true,
            response,
        };
    } catch (error: any) {
        console.error("Error subscribing to topic:", error);
        return {
            ok: false,
            error: error.message,
        };
    }
}
export async function unsubscribeStudentFromTopic(fcmToken: string) {
    try {
        const response = await admin.messaging().unsubscribeFromTopic(fcmToken, "students");

        return {
            ok: true,
            response,
        };
    } catch (error: any) {
        console.error("Error unsubscribing from topic:", error);
        return {
            ok: false,
            error: error.message,
        };
    }
}
export async function updateStudentFcmToken(
    oldToken: string,
    newToken: string
) {
    try {
        if (oldToken && oldToken.trim() !== "") {
            await unsubscribeStudentFromTopic(oldToken);
        }

        if (newToken && newToken.trim() !== "") {
            await subscribeStudentToTopic(newToken);
        }

        return {
            ok: true,
        };
    } catch (error: any) {
        console.error("Error updating FCM token:", error);
        return {
            ok: false,
            error: error.message,
        };
    }
}