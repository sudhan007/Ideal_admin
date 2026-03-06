import { getCollection } from "@lib/config/db.config";
import { AttendanceStatus, SessionType, StoreType } from "@types";
import { Context } from "elysia";
import { ObjectId } from "mongodb";
import { MarkAttendanceSchema } from "./attendance.model";
import { ATTENDANCE_SESSION_COLLECTION, BATCH_COLLECTION, BATCH_ENROLLMENTS_COLLECTION, STUDENT_ATTENDANCE_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";
import { sendBulkAttendanceNotifications } from "@lib/utils/whatsapp_notification/whatsapp_push_notification";
import { sendNotification } from "@lib/utils/notification";

export async function sendAttendancePushNotification(
    fcmToken: string,
    studentName: string,
    status: AttendanceStatus,
    date: string
) {
    const title = "Attendance Update";

    const body =
        status === AttendanceStatus.PRESENT
            ? `✅ ${studentName} is marked PRESENT on ${date}`
            : `❌ ${studentName} is marked ABSENT on ${date}`;

    return sendNotification(fcmToken, title, body);
}

// export const saveAttendanceRecords = async (ctx: Context<{ body: MarkAttendanceSchema }>) => {
//     const { body, set, store } = ctx;
//     const { id: userId } = store as StoreType;
//     const { batchId, sessionDate, sessionType, reason, records } = body;

//     try {
//         const attendanceSessionCollection = await getCollection(ATTENDANCE_SESSION_COLLECTION);
//         const attendanceRecordCollection = await getCollection(STUDENT_ATTENDANCE_COLLECTION);
//         const batchEnrollmentCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);
//         const batchCollection = await getCollection(BATCH_COLLECTION);

//         // Step 1: Check if session already exists for this batch and date
//         let session = await attendanceSessionCollection.findOne({
//             batchId: new ObjectId(batchId),
//             sessionDate
//         });

//         let sessionId;

//         if (session) {
//             // Update existing session
//             const updateData: any = {
//                 sessionType,
//                 updatedAt: new Date()
//             };

//             if (reason) {
//                 updateData.reason = reason;
//             } else {
//                 // Remove reason field if not provided
//                 await attendanceSessionCollection.updateOne(
//                     { _id: session._id },
//                     {
//                         $set: updateData,
//                         $unset: { reason: "" }
//                     }
//                 );
//             }

//             if (reason) {
//                 await attendanceSessionCollection.updateOne(
//                     { _id: session._id },
//                     { $set: updateData }
//                 );
//             }

//             sessionId = session._id;
//         } else {
//             // Create new session
//             const newSession: any = {
//                 batchId: new ObjectId(batchId),
//                 sessionDate,
//                 sessionType,
//                 createdBy: new ObjectId(userId),
//                 createdAt: new Date()
//             };

//             if (reason) {
//                 newSession.reason = reason;
//             }

//             // Get courseId from batch
//             const batch = await batchCollection.findOne({ _id: new ObjectId(batchId) });
//             if (batch) {
//                 newSession.courseId = batch.courseId;
//             }

//             const result = await attendanceSessionCollection.insertOne(newSession);
//             sessionId = result.insertedId;
//         }

//         // Step 2: Handle attendance records (only for class sessions)
//         if (sessionType === SessionType.CLASS && records && records.length > 0) {
//             // Delete existing records for this session
//             await attendanceRecordCollection.deleteMany({
//                 attendanceSessionId: sessionId
//             });

//             // Insert new records
//             const attendanceRecords = records.map((record: any) => ({
//                 batchId: new ObjectId(batchId),
//                 attendanceSessionId: sessionId,
//                 studentId: new ObjectId(record.studentId),
//                 status: record.status,
//                 markedBy: new ObjectId(userId),
//                 markedAt: new Date()
//             }));

//             await attendanceRecordCollection.insertMany(attendanceRecords);

//             // Step 3: Update batch enrollment statistics for each student
//             for (const record of records) {
//                 // Count total classes attended by this student in this batch
//                 const totalPresent = await attendanceRecordCollection.countDocuments({
//                     batchId: new ObjectId(batchId),
//                     studentId: new ObjectId(record.studentId),
//                     status: AttendanceStatus.PRESENT
//                 });

//                 // Count total class sessions for this batch
//                 const totalClassSessions = await attendanceSessionCollection.countDocuments({
//                     batchId: new ObjectId(batchId),
//                     sessionType: SessionType.CLASS
//                 });

//                 const attendancePercentage = totalClassSessions > 0
//                     ? Math.round((totalPresent / totalClassSessions) * 100)
//                     : 0;

//                 // Update batch enrollment
//                 await batchEnrollmentCollection.updateOne(
//                     {
//                         studentId: new ObjectId(record.studentId),
//                         batchId: new ObjectId(batchId)
//                     },
//                     {
//                         $set: {
//                             totalClassesAttended: totalPresent,
//                             attendancePercentage,
//                             updatedAt: new Date()
//                         }
//                     }
//                 );
//             }
//         }

//         set.status = 200;
//         return {
//             ok: true,
//             message: "Attendance saved successfully",
//             sessionId: sessionId.toString()
//         };
//     } catch (error) {
//         console.error("Error saving attendance:", error);
//         set.status = 500;
//         return {
//             ok: false,
//             message: error instanceof Error ? error.message : "Unknown error"
//         };
//     }
// };
// export const getAttendanceSessions = async (ctx: Context) => {
//     const { query, set } = ctx;
//     const { batchId, year, month } = query;

//     try {
//         const attendanceSessionCollection = await getCollection(ATTENDANCE_SESSION_COLLECTION);

//         // Create date range for the month
//         const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
//         const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
//         const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

//         const sessions = await attendanceSessionCollection.find({
//             batchId: new ObjectId(batchId),
//             sessionDate: {
//                 $gte: startDate,
//                 $lte: endDate
//             }
//         }).sort({ createdAt: -1 }).toArray()
//         set.status = 200;
//         return {
//             ok: true,
//             sessions
//         };
//     } catch (error) {
//         console.error("Error fetching sessions:", error);
//         set.status = 500;
//         return {
//             ok: false,
//             message: error instanceof Error ? error.message : "Unknown error"
//         };
//     }
// };
export const saveAttendanceRecords = async (ctx: Context<{ body: MarkAttendanceSchema }>) => {
    const { body, set, store } = ctx;
    const { id: userId } = store as StoreType;
    const { batchId, sessionDate, sessionType, reason, records }: any = body;

    try {
        const attendanceSessionCollection = await getCollection(ATTENDANCE_SESSION_COLLECTION);
        const attendanceRecordCollection = await getCollection(STUDENT_ATTENDANCE_COLLECTION);
        const batchEnrollmentCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);
        const batchCollection = await getCollection(BATCH_COLLECTION);
        const studentCollection = await getCollection(STUDENT_COLLECTION); // Add this collection

        // Step 1: Check if session already exists for this batch and date
        let session = await attendanceSessionCollection.findOne({
            batchId: new ObjectId(batchId),
            sessionDate
        });

        let sessionId;

        if (session) {
            // Update existing session
            const updateData: any = {
                sessionType,
                updatedAt: new Date()
            };

            if (reason) {
                updateData.reason = reason;
            } else {
                // Remove reason field if not provided
                await attendanceSessionCollection.updateOne(
                    { _id: session._id },
                    {
                        $set: updateData,
                        $unset: { reason: "" }
                    }
                );
            }

            if (reason) {
                await attendanceSessionCollection.updateOne(
                    { _id: session._id },
                    { $set: updateData }
                );
            }

            sessionId = session._id;
        } else {
            // Create new session
            const newSession: any = {
                batchId: new ObjectId(batchId),
                sessionDate,
                sessionType,
                createdBy: new ObjectId(userId),
                createdAt: new Date()
            };

            if (reason) {
                newSession.reason = reason;
            }

            // Get courseId from batch
            const batch = await batchCollection.findOne({ _id: new ObjectId(batchId) });
            if (batch) {
                newSession.courseId = batch.courseId;
            }

            const result = await attendanceSessionCollection.insertOne(newSession);
            sessionId = result.insertedId;
        }

        // Step 2: Handle attendance records (only for class sessions)
        if (sessionType === SessionType.CLASS && records && records.length > 0) {
            // Delete existing records for this session
            await attendanceRecordCollection.deleteMany({
                attendanceSessionId: sessionId
            });

            // Insert new records
            const attendanceRecords = records.map((record: any) => ({
                batchId: new ObjectId(batchId),
                attendanceSessionId: sessionId,
                studentId: new ObjectId(record.studentId),
                status: record.status,
                markedBy: new ObjectId(userId),
                markedAt: new Date()
            }));

            await attendanceRecordCollection.insertMany(attendanceRecords);

            // Step 3: Update batch enrollment statistics for each student
            for (const record of records) {
                // Count total classes attended by this student in this batch
                const totalPresent = await attendanceRecordCollection.countDocuments({
                    batchId: new ObjectId(batchId),
                    studentId: new ObjectId(record.studentId),
                    status: AttendanceStatus.PRESENT
                });

                // Count total class sessions for this batch
                const totalClassSessions = await attendanceSessionCollection.countDocuments({
                    batchId: new ObjectId(batchId),
                    sessionType: SessionType.CLASS
                });

                const attendancePercentage = totalClassSessions > 0
                    ? Math.round((totalPresent / totalClassSessions) * 100)
                    : 0;

                // Update batch enrollment
                await batchEnrollmentCollection.updateOne(
                    {
                        studentId: new ObjectId(record.studentId),
                        batchId: new ObjectId(batchId)
                    },
                    {
                        $set: {
                            totalClassesAttended: totalPresent,
                            attendancePercentage,
                            updatedAt: new Date()
                        }
                    }
                );
            }


        }

        setImmediate(async () => {
            try {
                const studentsData = await Promise.all(
                    records.map(async (record: any) => {
                        const student = await studentCollection.findOne({
                            _id: new ObjectId(record.studentId)
                        })

                        return {
                            student,
                            attendanceDate: sessionDate,
                            attendanceStatus: record.status
                        };
                    })
                );

                const validStudentsData = studentsData.filter(
                    data => data.student !== null
                );

                /* ------------------ WhatsApp Notifications ------------------ */
                if (validStudentsData.length > 0) {
                    const notificationResult =
                        await sendBulkAttendanceNotifications(validStudentsData);

                    console.log("WhatsApp Notification Results:", notificationResult);
                }

                /* ------------------ FCM Push Notifications ------------------ */
                for (const data of validStudentsData) {
                    const { student, attendanceStatus, attendanceDate } = data;

                    if (!student?.fcmToken) continue; // skip if no token

                    await sendAttendancePushNotification(
                        student.fcmToken,
                        student.studentName,
                        attendanceStatus,
                        attendanceDate
                    );
                }

            } catch (notificationError) {
                console.error(
                    "Error sending WhatsApp / FCM notifications:",
                    notificationError
                );
            }
        });


        set.status = 200;
        return {
            ok: true,
            message: "Attendance saved successfully",
            sessionId: sessionId.toString()
        };
    } catch (error) {
        console.error("Error saving attendance:", error);
        set.status = 500;
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
export const getAttendanceSessions = async (ctx: Context) => {
    const { query, set } = ctx;
    const { batchId, year, month } = query;

    try {
        const attendanceSessionCollection = await getCollection(ATTENDANCE_SESSION_COLLECTION);

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        const sessionsArray = await attendanceSessionCollection.find({
            batchId: new ObjectId(batchId),
            sessionDate: { $gte: startDate, $lte: endDate }
        }).sort({ sessionDate: 1 }).toArray();  // ← sort by date is nicer for calendar

        // Transform to date-keyed object
        const sessionsMap: Record<string, any> = {};

        sessionsArray.forEach((s) => {
            const dateKey = s.sessionDate;
            sessionsMap[dateKey] = {
                _id: s._id.toString(),
                sessionDate: s.sessionDate,
                sessionType: s.sessionType,           // keep as-is or .toLowerCase()
                batchId: s.batchId.toString(),
                reason: s.reason || undefined,
                createdBy: s.createdBy?.toString(),
                createdAt: s.createdAt,
                courseId: s.courseId?.toString(),
            };
        });

        set.status = 200;
        return {
            ok: true,
            sessions: sessionsMap   // ← now an object, not array
        };
    } catch (error) {
        console.error("Error fetching sessions:", error);
        set.status = 500;
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
export const getBatchStudents = async (ctx: Context) => {
    const { query, set } = ctx;
    const { batchId } = query;

    try {
        const batchEnrollmentCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);

        const students = await batchEnrollmentCollection.aggregate([
            {
                $match: {
                    batchId: new ObjectId(batchId)
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student"
                }
            },
            {
                $unwind: "$student"
            },
            {
                $project: {
                    _id: "$student._id",
                    studentName: "$student.studentName",
                    studentPhoneNumber: "$student.studentPhoneNumber",
                    totalClassesAttended: 1,
                    attendancePercentage: 1
                }
            },
            {
                $sort: { studentName: 1 }
            }
        ]).toArray();

        set.status = 200;
        return {
            ok: true,
            students
        };
    } catch (error) {
        console.error("Error fetching students:", error);
        set.status = 500;
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
};


// Get attendance records for a specific session
export const getAttendanceRecords = async (ctx: Context) => {
    const { query, set } = ctx;
    const { batchId, sessionDate } = query;

    try {
        const attendanceSessionCollection = await getCollection(ATTENDANCE_SESSION_COLLECTION);
        const attendanceRecordCollection = await getCollection(STUDENT_ATTENDANCE_COLLECTION);

        // Find the session
        const session = await attendanceSessionCollection.findOne({
            batchId: new ObjectId(batchId),
            sessionDate
        });

        if (!session) {
            set.status = 404;
            return {
                ok: false,
                message: "Session not found"
            };
        }

        // Get all attendance records with student details
        const records = await attendanceRecordCollection.aggregate([
            {
                $match: {
                    attendanceSessionId: session._id
                }
            },
            {
                $lookup: {
                    from: 'students', // Your students collection name
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'studentDetails'
                }
            },
            {
                $unwind: '$studentDetails'
            },
            {
                $project: {
                    _id: 1,
                    studentId: { $toString: '$studentId' },
                    studentName: '$studentDetails.name',
                    studentPhoneNumber: '$studentDetails.phoneNumber',
                    status: 1,
                    markedAt: 1,
                    markedBy: 1
                }
            },
            {
                $sort: { studentName: 1 }
            }
        ]).toArray();

        set.status = 200;
        return {
            ok: true,
            records: records.map(r => ({
                _id: r._id.toString(),
                studentId: r.studentId,
                studentName: r.studentName,
                studentPhoneNumber: r.studentPhoneNumber,
                status: r.status,
                markedAt: r.markedAt,
                markedBy: r.markedBy?.toString()
            }))
        };
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        set.status = 500;
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
export const getSessionDetails = async (ctx: Context) => {
    const { query, set } = ctx;
    const { batchId, sessionDate } = query;

    try {
        const attendanceSessionCollection = await getCollection(ATTENDANCE_SESSION_COLLECTION);

        const session = await attendanceSessionCollection.findOne({
            batchId: new ObjectId(batchId),
            sessionDate
        });

        if (!session) {
            set.status = 404;
            return {
                ok: false,
                message: "Session not found"
            };
        }

        set.status = 200;
        return {
            ok: true,
            session: {
                _id: session._id.toString(),
                batchId: session.batchId.toString(),
                sessionDate: session.sessionDate,
                sessionType: session.sessionType,
                reason: session.reason,
                createdAt: session.createdAt,
                createdBy: session.createdBy?.toString(),
                courseId: session.courseId?.toString()
            }
        };
    } catch (error) {
        console.error("Error fetching session details:", error);
        set.status = 500;
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
export const getStudentAttendance = async (ctx: Context) => {
    const { query, set } = ctx;
    const { studentId, batchId, year, month } = query;

    try {
        const attendanceSessionCollection = await getCollection(ATTENDANCE_SESSION_COLLECTION);
        const studentAttendanceCollection = await getCollection(STUDENT_ATTENDANCE_COLLECTION);

        // Validate required parameters
        if (!studentId || !batchId || !year || !month) {
            set.status = 400;
            return {
                ok: false,
                message: "Missing required parameters: studentId, batchId, year, month"
            };
        }

        // Create date range for the requested month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        // 1. Get all sessions for this batch in the month
        const sessions = await attendanceSessionCollection.find({
            batchId: new ObjectId(batchId),
            sessionDate: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ sessionDate: 1 }).toArray();

        // Working days = CLASS sessions
        const classSessions = sessions.filter(s => s.sessionType === "CLASS");
        const workingDays = classSessions.length;

        // Holidays
        const holidaySessions = sessions.filter(s => s.sessionType === "HOLIDAY");
        const holidaysCount = holidaySessions.length;
        const holidaysList = holidaySessions.map(s => ({
            date: s.sessionDate,
            reason: s.reason || "Holiday"
        }));

        // Get CLASS session IDs
        const classSessionIds = classSessions.map(s => s._id);

        // 2. Get student's attendance records for CLASS sessions in this month
        const attendanceRecords = await studentAttendanceCollection.find({
            studentId: new ObjectId(studentId),
            attendanceSessionId: { $in: classSessionIds }
        }).toArray();

        // Create a map: sessionId → record
        const recordMap = new Map(
            attendanceRecords.map(r => [r.attendanceSessionId.toString(), r])
        );

        // 3. Build detailed lists + calculate counts
        const presentList: { date: string; status: string }[] = [];
        const absentList: { date: string; status: string }[] = [];

        let presentCount = 0;

        classSessions.forEach(session => {
            const sessionIdStr = session._id.toString();
            const record = recordMap.get(sessionIdStr);

            const date = session.sessionDate;
            let status = "ABSENT"; // default if no record

            if (record) {
                status = record.status;
                if (status === "PRESENT") {
                    presentCount++;
                    presentList.push({ date, status });
                } else {
                    absentList.push({ date, status });
                }
            } else {
                // No record → considered absent
                absentList.push({ date, status });
            }
        });

        const absentCount = workingDays - presentCount;

        set.status = 200;
        return {
            ok: true,
            summary: {
                workingDays,       // number of CLASS sessions
                presentDays: presentCount,
                absentDays: absentCount,
                holidaysCount,
            },
            presentList,           // [{ date: "2026-01-20", status: "PRESENT" }, ...]
            absentList,            // [{ date: "2026-01-18", status: "ABSENT" }, ...]
            holidaysList           // [{ date: "2026-01-17", reason: "hollll" }, ...]
        };
    } catch (error) {
        console.error("Error fetching student attendance:", error);
        set.status = 500;
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
};


