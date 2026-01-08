import Elysia from "elysia";
import { getCourseProgress, getEnrollmentDetails, updateLessonProgress } from "./course-tracking.service";
import { updateLessonProgressDto } from "./course-traking.model";

export const enrollmentRoutes = new Elysia({ prefix: "/course-tracking" })
    .patch("/progress", updateLessonProgress, updateLessonProgressDto)
    .get("/progress/:enrollmentId", getCourseProgress)
    .get("/:studentId/:courseId", getEnrollmentDetails);