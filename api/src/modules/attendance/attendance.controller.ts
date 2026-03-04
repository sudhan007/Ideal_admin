import { Elysia } from "elysia";
import { getAttendanceRecords, getAttendanceSessions, getBatchStudents, getSessionDetails, getStudentAttendance, saveAttendanceRecords } from "./attendance.service";
import { markAttendanceDto } from "./attendance.model";

export const attendanceController = new Elysia({
    prefix: '/attendance',
    detail: {
        tags: ["Attendance"]
    }
})
    .post('/mark', saveAttendanceRecords, markAttendanceDto)
    .get('/sessions', getAttendanceSessions)
    .get('/students-list', getBatchStudents)
    .get('/records', getAttendanceRecords)
    .get('/details', getSessionDetails)
    .get('/offline-students', getStudentAttendance)


