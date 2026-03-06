import { Context } from "elysia";
import { UpdateVideoProgressSchema } from "./course-traking.model";
import { updateQuizProgressFN, updateVideoProgressFN } from "@lib/utils/course-tracking";
import { StoreType } from "@types";

/**
 * Update lesson progress (video or quiz)
 */
export const updateVideoProgress = async (
    ctx: Context<{ body: UpdateVideoProgressSchema }>
) => {
    const { body, set, store } = ctx;
    const { id } = store as StoreType
    const { enrollmentId, lessonId, watchedSeconds } = body; // Assuming schema has these fields
    console.log(body, id)
    try {
        const result = await updateVideoProgressFN(enrollmentId, lessonId, watchedSeconds, id);

        if (!result.success) {
            set.status = 400;
            return {
                status: false,
                message: result.message
            };
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

// export const updateQuizProgress = async (
//     ctx: Context<{ body: UpdateQuizProgressSchema }>
// ) => {
//     const { body, set } = ctx;
//     const { enrollmentId, lessonId, correctAnswers } = body; // Assuming schema has these fields

//     try {
//         const result = await updateQuizProgressFN(enrollmentId, lessonId, correctAnswers);

//         if (!result.success) {
//             set.status = 400;
//             return {
//                 status: false,
//                 message: result.message
//             };
//         }

//         set.status = 200;
//         return {
//             message: "Progress updated successfully",
//             status: true,
//         };
//     } catch (error: any) {
//         console.error("Update progress error:", error);
//         set.status = 500;
//         return {
//             message: error?.message || "Failed to update progress",
//             status: false,
//         };
//     }
// };



// export const getCourseProgress = async (
//     ctx: Context<{ params: { enrollmentId: string } }>
// ) => {
//     const { params, set } = ctx;
//     const { enrollmentId } = params;

//     try {
//         const chapterProgress = await getChapterProgress(enrollmentId);

//         set.status = 200;
//         return {
//             message: "Progress fetched successfully",
//             status: true,
//             data: {
//                 chapters: chapterProgress,
//             },
//         };
//     } catch (error: any) {
//         console.error("Get progress error:", error);
//         set.status = 500;
//         return {
//             message: error?.message || "Failed to fetch progress",
//             status: false,
//         };
//     }
// };

// export const getEnrollmentDetails = async (
//     ctx: Context<{ params: { studentId: string; courseId: string } }>
// ) => {
//     const { params, set } = ctx;
//     const { studentId, courseId } = params;

//     try {
//         const enrollment = await getStudentCourseEnrollment(studentId, courseId);

//         if (!enrollment) {
//             set.status = 404;
//             return {
//                 message: "Enrollment not found",
//                 status: false,
//             };
//         }

//         set.status = 200;
//         return {
//             message: "Enrollment details fetched successfully",
//             status: true,
//             data: enrollment,
//         };
//     } catch (error: any) {
//         console.error("Get enrollment error:", error);
//         set.status = 500;
//         return {
//             message: error?.message || "Failed to fetch enrollment details",
//             status: false,
//         };
//     }
// };