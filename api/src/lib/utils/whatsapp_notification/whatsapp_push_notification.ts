import axios from 'axios';

// Configuration
const MSG91_CONFIG = {
    authKey: process.env.MSG91_AUTH_KEY || '<authkey>',
    integratedNumber: process.env.MSG91_INTEGRATED_NUMBER || '919843322968',
    apiUrl: 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    templateNamespace: 'a15c3ef7_bc21_4e2b_88e9_eb583e9be945'
};

interface WhatsAppRecipient {
    phoneNumber: string;
    studentName: string;
    attendanceDate: string;
    attendanceStatus: string;
}

interface SendWhatsAppParams {
    recipients: WhatsAppRecipient[];
    templateName?: string;
}

const normalizePhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, ''); // remove any non-digits

    // If already has 91 prefix or is 12 digits (91 + 10), return as is
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return cleaned;
    }

    // If it's 10 digits and starts with 6-9 (valid Indian mobile), add 91
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
        return '91' + cleaned;
    }

    // Otherwise return as-is (or throw error if you want strict validation)
    return cleaned;
};

/**
 * Send WhatsApp attendance notification to multiple recipients
 * @param params - Contains recipients array with phone numbers and template data
 * @returns Promise with send result
 */
export const sendWhatsAppAttendanceNotification = async (
    params: SendWhatsAppParams
): Promise<{ success: boolean; message: string; details?: any }> => {
    const { recipients, templateName = 'attendance' } = params;

    try {
        // Validate recipients
        if (!recipients || recipients.length === 0) {
            throw new Error('No recipients provided');
        }

        // Group recipients by their template values to send in batches
        const toAndComponents = recipients.map(recipient => ({
            to: [normalizePhoneNumber(recipient.phoneNumber)],
            components: {
                header_1: {
                    type: 'text',
                    value: recipient.studentName
                },
                body_1: {
                    type: 'text',
                    value: recipient.studentName
                },
                body_2: {
                    type: 'text',
                    value: recipient.attendanceDate
                },
                body_3: {
                    type: 'text',
                    value: recipient.attendanceStatus
                }
            }
        }));

        const requestData = {
            integrated_number: MSG91_CONFIG.integratedNumber,
            content_type: 'template',
            payload: {
                messaging_product: 'whatsapp',
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: 'en',
                        policy: 'deterministic'
                    },
                    namespace: MSG91_CONFIG.templateNamespace,
                    to_and_components: toAndComponents
                }
            }
        };
        console.log(MSG91_CONFIG, "SSS")
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

        return {
            success: true,
            message: 'WhatsApp notifications sent successfully',
            details: response.data
        };

    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);

        if (axios.isAxiosError(error)) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send WhatsApp notifications',
                details: error.response?.data
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

/**
 * Format attendance status for display
 */
const formatAttendanceStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'PRESENT': '✓ Present',
        'ABSENT': '✗ Absent',
        'LATE': '⏰ Late',
        'EXCUSED': '📝 Excused'
    };

    return statusMap[status] || status;
};

/**
 * Send attendance notification to both student and parent
 * @param student - Student document from database
 * @param attendanceDate - Date of attendance
 * @param attendanceStatus - Status (PRESENT/ABSENT/LATE/EXCUSED)
 */
export const sendAttendanceNotificationToStudentAndParent = async (
    student: any,
    attendanceDate: string,
    attendanceStatus: string
): Promise<{ success: boolean; message: string; sentTo: string[] }> => {
    const recipients: WhatsAppRecipient[] = [];
    const sentTo: string[] = [];

    // Format the date nicely
    const formattedDate = new Date(attendanceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const formattedStatus = formatAttendanceStatus(attendanceStatus);

    // Add student's phone number if available
    if (student.studentPhoneNumber) {
        recipients.push({
            phoneNumber: student.studentPhoneNumber,
            studentName: student.studentName,
            attendanceDate: formattedDate,
            attendanceStatus: formattedStatus
        });
        sentTo.push(`Student: ${student.studentPhoneNumber}`);
    }

    // Add parent's phone number if available
    if (student.parentPhoneNumber) {
        recipients.push({
            phoneNumber: normalizePhoneNumber(student.parentPhoneNumber),
            studentName: student.studentName,
            attendanceDate: formattedDate,
            attendanceStatus: formattedStatus
        });
        sentTo.push(`Parent: ${student.parentPhoneNumber}`);
    }
    if (student.parentPhoneNumber2) {
        recipients.push({
            phoneNumber: normalizePhoneNumber(student.parentPhoneNumber2),
            studentName: student.studentName,
            attendanceDate: formattedDate,
            attendanceStatus: formattedStatus
        });
        sentTo.push(`Parent: ${student.parentPhoneNumber2}`);
    }
    if (recipients.length === 0) {
        return {
            success: false,
            message: 'No phone numbers available for student or parent',
            sentTo: []
        };
    }

    const result = await sendWhatsAppAttendanceNotification({ recipients });

    return {
        success: result.success,
        message: result.message,
        sentTo: result.success ? sentTo : []
    };
};

/**
 * Send bulk attendance notifications for multiple students
 * @param studentsData - Array of student data with attendance info
 */
export const sendBulkAttendanceNotifications = async (
    studentsData: Array<{
        student: any;
        attendanceDate: string;
        attendanceStatus: string;
    }>
): Promise<{
    success: boolean;
    totalSent: number;
    failed: number;
    details: any[]
}> => {
    const results: any[] = [];
    let totalSent = 0;
    let failed = 0;
    console.log(studentsData, "studentData")
    for (const data of studentsData) {
        try {
            const result = await sendAttendanceNotificationToStudentAndParent(
                data.student,
                data.attendanceDate,
                data.attendanceStatus
            );

            results.push({
                studentName: data.student.studentName,
                success: result.success,
                sentTo: result.sentTo,
                message: result.message
            });

            if (result.success) {
                totalSent += result.sentTo.length;
            } else {
                failed++;
            }

            // Add delay to avoid rate limiting (optional)
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            failed++;
            results.push({
                studentName: data.student.studentName,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    return {
        success: failed === 0,
        totalSent,
        failed,
        details: results
    };
};