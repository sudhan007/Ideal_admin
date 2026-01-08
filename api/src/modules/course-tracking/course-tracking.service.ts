import { Context } from "elysia";
import { UpdateLessonProgressSchema } from "./course-traking.model";
import { getChapterProgress, getStudentCourseEnrollment, updateQuizProgress, updateVideoProgress } from "@lib/utils/course-tracking";

/**
 * Update lesson progress (video or quiz)
 */
export const updateLessonProgress = async (
    ctx: Context<{ body: UpdateLessonProgressSchema }>
) => {
    const { body, set } = ctx;
    const { enrollmentId, lessonId, videoProgress, quizProgress } = body;

    try {
        let result;

        // Update video progress if provided
        if (videoProgress) {
            result = await updateVideoProgress(
                enrollmentId,
                lessonId,
                videoProgress.watchedDuration,
                videoProgress.totalDuration,
                videoProgress.lastWatchedPosition
            );

            if (!result.success) {
                set.status = 400;
                return {
                    message: result.message,
                    status: false,
                };
            }
        }

        // Update quiz progress if provided
        if (quizProgress) {
            result = await updateQuizProgress(
                enrollmentId,
                lessonId,
                quizProgress.passed,
                quizProgress.score,
                quizProgress.totalQuestions,
                quizProgress.correctAnswers
            );

            if (!result.success) {
                set.status = 400;
                return {
                    message: result.message,
                    status: false,
                };
            }
        }

        set.status = 200;
        return {
            message: "Progress updated successfully",
            status: true,
        };
    } catch (error: any) {
        console.error("Update progress error:", error);
        set.status = 500;
        return {
            message: error?.message || "Failed to update progress",
            status: false,
        };
    }
};

/**
 * Get student's course progress
 */
export const getCourseProgress = async (
    ctx: Context<{ params: { enrollmentId: string } }>
) => {
    const { params, set } = ctx;
    const { enrollmentId } = params;

    try {
        const chapterProgress = await getChapterProgress(enrollmentId);

        set.status = 200;
        return {
            message: "Progress fetched successfully",
            status: true,
            data: {
                chapters: chapterProgress,
            },
        };
    } catch (error: any) {
        console.error("Get progress error:", error);
        set.status = 500;
        return {
            message: error?.message || "Failed to fetch progress",
            status: false,
        };
    }
};

/**
 * Get student's enrollment details with progress
 */
export const getEnrollmentDetails = async (
    ctx: Context<{ params: { studentId: string; courseId: string } }>
) => {
    const { params, set } = ctx;
    const { studentId, courseId } = params;

    try {
        const enrollment = await getStudentCourseEnrollment(studentId, courseId);

        if (!enrollment) {
            set.status = 404;
            return {
                message: "Enrollment not found",
                status: false,
            };
        }

        set.status = 200;
        return {
            message: "Enrollment details fetched successfully",
            status: true,
            data: enrollment,
        };
    } catch (error: any) {
        console.error("Get enrollment error:", error);
        set.status = 500;
        return {
            message: error?.message || "Failed to fetch enrollment details",
            status: false,
        };
    }
};