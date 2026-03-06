import { AttendanceStatus, SessionType } from "@types";
import { t } from "elysia";


export const markAttendanceDto = {
    body: t.Object({
        batchId: t.String(),
        sessionDate: t.String({ format: "date" }),
        sessionType: t.Enum(SessionType),
        reason: t.Optional(t.String()),
        records: t.Optional(
            t.Array(
                t.Object({
                    studentId: t.String(),
                    status: t.Enum(AttendanceStatus),
                })
            )
        ),
    }),
    detail: {
        description: "Create mark Attendance",
        summary: "Create mark Attendance"
    }
}


export type MarkAttendanceSchema = typeof markAttendanceDto.body.static
