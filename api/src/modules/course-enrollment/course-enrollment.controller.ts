import { Elysia } from "elysia";
import { adminOnly } from "@lib/utils/roles-guard";
import { OfflineCourseEnrollment } from "./course-enrollment.service";
import { CreateOfflineCousreEnrollmentDto } from "./course-enrollment.model";

export const courseEnrollmentController = new Elysia({
    prefix: '/course-enrollment',
    detail: {
        tags: ["Course Enrollment"]
    }
})

    .post('/offline', OfflineCourseEnrollment, { ...CreateOfflineCousreEnrollmentDto, beforeHandle: adminOnly })
