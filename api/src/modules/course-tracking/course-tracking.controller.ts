import Elysia from "elysia";
import { updateVideoProgressDto } from "./course-traking.model";
import { updateVideoProgress } from "./course-tracking.service";
import { studentOnly } from "@lib/utils/roles-guard";

export const courseTrackingController = new Elysia({
    prefix: "/course-tracking", detail: {
        tags: ["Course Tracking"]
    }
})
    .patch("/update-video", updateVideoProgress, { ...updateVideoProgressDto, beforeHandle: studentOnly })
// .patch("/update-quiz", updateQuizProgress, updateLessonProgressDto)

// .get("/:studentId/:courseId", getEnrollmentDetails);