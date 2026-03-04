import { Context } from "elysia";
import { batchNotficationSchema, SendNotificationallSchema } from "./notification.model";
import { sendNotificationToAllStudents } from "@lib/utils/notification";
import { ObjectId } from "mongodb";
import { getCollection } from "@lib/config/db.config";
import { BATCH_COLLECTION, BATCH_ENROLLMENTS_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";
import axios from "axios";

const MSG91_CONFIG = {
    authKey: process.env.MSG91_AUTH_KEY || '<authkey>',
    integratedNumber: process.env.MSG91_INTEGRATED_NUMBER || '919843322968',
    apiUrl: 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    templateNamespace: 'a15c3ef7_bc21_4e2b_88e9_eb583e9be945'
};
export const sendNotificationAll = async (ctx: Context<{ body: SendNotificationallSchema }>) => {
    const { body, set } = ctx;
    const { body: message, title } = body
    try {

        sendNotificationToAllStudents(title, message);

        set.status = 201;
        return {
            message: "Notification sent successfully",
        }
    } catch (error) {
        console.log("Notification Created Error", error)
        set.status = 500;
        return { error: "Failed to create Notification" };
    }
}


export const batchWhatsappNotification = async (ctx: Context<{ body: batchNotficationSchema }>) => { // Adjust ctx type as per your Trpc/Mongo setup
    const { body, set } = ctx;
    const { batchId, templateName, parameters, sendToStudent = false } = body;

    try {
        console.log(MSG91_CONFIG); // Keep for debugging if needed

        const batchCollection = await getCollection(BATCH_COLLECTION);
        const batchEnrollmentCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);
        const studentCollection = await getCollection(STUDENT_COLLECTION);

        // Validate batch exists and is active
        const batch = await batchCollection.findOne({
            _id: new ObjectId(batchId),
            isActive: true,
            isDeleted: false
        });
        if (!batch) {
            throw new Error('Invalid or inactive batch');
        }

        // Fetch enrollments for the batch
        const enrollments = await batchEnrollmentCollection.find({
            batchId: new ObjectId(batchId)
        }).toArray();

        if (enrollments.length === 0) {
            return { success: true, message: 'No enrollments found in this batch', sentCount: 0 };
        }

        const studentIds = enrollments.map((e: any) => e.studentId);

        // Fetch all active students in one query (optimized)
        const students = await studentCollection.find({
            _id: { $in: studentIds },
            isActive: true,
            isDeleted: false
        }).toArray();

        // Collect all valid phones across students (no per-student params, so one big list)
        const allValidPhones: string[] = [];

        for (const student of students) {
            if (student.parentPhoneNumber && /^\d{10}$/.test(student.parentPhoneNumber)) {
                allValidPhones.push(`91${student.parentPhoneNumber}`);
            }
            if (student.parentPhoneNumber2 && /^\d{10}$/.test(student.parentPhoneNumber2)) {
                allValidPhones.push(`91${student.parentPhoneNumber2}`);
            }

            // Optionally add student phone
            if (sendToStudent && student.studentPhoneNumber && /^\d{10}$/.test(student.studentPhoneNumber)) {
                allValidPhones.push(`91${student.studentPhoneNumber}`);
            }
        }

        if (allValidPhones.length === 0) {
            return { success: true, message: 'No valid phone numbers found', sentCount: 0 };
        }

        // Dynamically build components based on parameters (assuming template uses body_1, body_2, etc.)
        // Adjust field names if your templates use header_1, body_1, etc. differently
        const components = {
            ...(parameters[0] && { body_1: { type: 'text', value: parameters[0] } }),
            ...(parameters[1] && { body_2: { type: 'text', value: parameters[1] } }),
            ...(parameters[2] && { body_3: { type: 'text', value: parameters[2] } }),
            ...(parameters[3] && { body_4: { type: 'text', value: parameters[3] } }),
            // Add more as needed (e.g., header_1 if first param is header)
            // If templates vary, you could make this template-specific
        };

        // Build to_and_components array (one per phone, with same components)
        const toAndComponents = allValidPhones.map(phone => ({
            to: [phone],
            components
        }));

        // Prepare the request payload (matching the working code structure)
        const requestData = {
            integrated_number: MSG91_CONFIG.integratedNumber,
            content_type: 'template',
            payload: {
                messaging_product: 'whatsapp',
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: 'en', // Adjust per template (e.g., 'ta' for Tamil)
                        policy: 'deterministic'
                    },
                    namespace: MSG91_CONFIG.templateNamespace,
                    to_and_components: toAndComponents
                }
            }
        };

        // Send via axios (matching working code; fetch can work too but axios handles errors better)
        const response = await axios.post(
            MSG91_CONFIG.apiUrl,
            requestData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'authkey': MSG91_CONFIG.authKey
                }
            }
        );

        set.status = 201;
        return {
            success: true,
            sentCount: allValidPhones.length,
            batchName: batch.batchName,
            apiResponse: response.data
        };

    } catch (error) {
        console.error("Batch WhatsApp Notification Error:", error);
        set.status = 500;

        // Improved error handling (matching working code)
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to send batch notification',
                details: error.response?.data
            };
        }

        return {
            success: false,
            error: "Failed to send batch notification",
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};