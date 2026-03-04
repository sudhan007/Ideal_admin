import { t } from "elysia"

export const CreateOfflineCousreEnrollmentDto = {
    body: t.Object({
        courseId: t.String(),
        studentId: t.String(),
        batchId: t.String(),
    }),
    detail: {
        summary: "Create Offline Enrollment",
        description: "Create Offline Enrollment"
    }
}

export type createOFFlineEnrollmenSchema = typeof CreateOfflineCousreEnrollmentDto.body.static