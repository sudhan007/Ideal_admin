
import { getCollection } from "@lib/config/db.config";
import { CHAPTER_PROGRESS_COLLECTION, COURSE_ENROLLMENT_COLLECTION, COURSE_PROGRESS_COLLECTION, LESSONS_COLLECTION, LESSON_PROGRESS_COLLECTION, } from "@lib/Db_collections";
import { passPercentage } from "@types";
import { ObjectId } from "mongodb";

// // Assuming these interfaces are defined elsewhere as per the provided code
// // ... (CourseEnrollment, LessonProgress, ChapterProgress, CourseEnrollmentProgress)

// // Service functions

// /**
//  * Update video progress for a lesson
//  */
// export const updateVideoProgressFN = async (
//     enrollmentId: string,
//     lessonId: string,
//     watchedSeconds: number,
//     studentId: string
// ): Promise<{ success: boolean; message: string }> => {
//     try {
//         const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

//         const lessonProgress = await lessonProgressCollection.findOne({
//             enrollmentId: new ObjectId(enrollmentId),
//             lessonId: new ObjectId(lessonId),
//             studentId: new ObjectId(studentId)
//         });

//         console.log(lessonProgress, "sss")

//         if (!lessonProgress) {
//             return { success: false, message: "Lesson progress not found" };
//         }

//         // Update to the maximum watched seconds
//         const newWatchedSeconds = Math.max(lessonProgress.videoWatchedSeconds, watchedSeconds);
//         const videoCompletionPercentage = Math.min(100, (newWatchedSeconds / lessonProgress.videoTotalSeconds) * 100);

//         await lessonProgressCollection.updateOne(
//             { _id: lessonProgress._id },
//             {
//                 $set: {
//                     videoWatchedSeconds: newWatchedSeconds,
//                     videoCompletionPercentage,
//                     lastWatchedAt: new Date(),
//                     updatedAt: new Date()
//                 }
//             }
//         );

//         // Check and update lesson completion status
//         await checkAndUpdateLessonCompletion(enrollmentId, lessonId);

//         return { success: true, message: "Video progress updated successfully" };
//     } catch (error: any) {
//         console.error("Error updating video progress:", error);
//         return { success: false, message: error?.message || "Failed to update video progress" };
//     }
// };

// // /**
// //  * Update quiz progress for a lesson
// //  * Assumes 10 questions total and passing requires 8 correct (configurable in future)
// //  */
// // export const updateQuizProgressFN = async (
// //     enrollmentId: string,
// //     lessonId: string,
// //     correctAnswers: number
// // ): Promise<{ success: boolean; message: string }> => {
// //     try {
// //         const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
// //         const lessonCollection = await getCollection(LESSON_COLLECTION);

// //         const lessonProgress = await lessonProgressCollection.findOne({
// //             enrollmentId: new ObjectId(enrollmentId),
// //             lessonId: new ObjectId(lessonId)
// //         });

// //         if (!lessonProgress) {
// //             return { success: false, message: "Lesson progress not found" };
// //         }

// //         // Fetch lesson to get configurable quiz settings (for future-proofing; hardcoded for now)
// //         const lesson = await lessonCollection.findOne({ _id: new ObjectId(lessonId) });
// //         if (!lesson) {
// //             return { success: false, message: "Lesson not found" };
// //         }

// //         // Hardcoded for now; later use lesson.quizTotalQuestions and lesson.quizPassingCorrect 10 / 8
// //         const totalQuestions = 2;
// //         const passingCorrect = 1;
// //         const quizPassed = correctAnswers >= passingCorrect;

// //         await lessonProgressCollection.updateOne(
// //             { _id: lessonProgress._id },
// //             {
// //                 $set: {
// //                     quizPassed,
// //                     updatedAt: new Date()
// //                 }
// //             }
// //         );

// //         // Check and update lesson completion status
// //         await checkAndUpdateLessonCompletion(enrollmentId, lessonId);

// //         return { success: true, message: "Quiz progress updated successfully" };
// //     } catch (error: any) {
// //         console.error("Error updating quiz progress:", error);
// //         return { success: false, message: error?.message || "Failed to update quiz progress" };
// //     }
// // };
// /**
//  * Update quiz progress for a lesson
//  * Student must score 80% or above to pass (configurable via passPercentage constant)
//  */
// export const updateQuizProgressFN = async (
//     enrollmentId: string,
//     lessonId: string,
//     correctAnswers: number,
//     totalQuestions: number // Add total questions as parameter
// ): Promise<{ success: boolean; message: string }> => {
//     try {
//         const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
//         const lessonCollection = await getCollection(LESSONS_COLLECTION);

//         const lessonProgress = await lessonProgressCollection.findOne({
//             enrollmentId: new ObjectId(enrollmentId),
//             lessonId: new ObjectId(lessonId)
//         });

//         if (!lessonProgress) {
//             return { success: false, message: "Lesson progress not found" };
//         }

//         if (lessonProgress.quizPassed === true) {
//             return {
//                 success: true,
//                 message: "Quiz already passed — no further updates allowed"
//             };
//         }

//         const lesson = await lessonCollection.findOne({ _id: new ObjectId(lessonId) });
//         if (!lesson) {
//             return { success: false, message: "Lesson not found" };
//         }

//         // Calculate percentage score
//         const scorePercentage = totalQuestions > 0
//             ? (correctAnswers / totalQuestions) * 100
//             : 0;

//         // Check if student passed (80% or above)
//         const quizPassed = scorePercentage >= passPercentage;

//         await lessonProgressCollection.updateOne(
//             { _id: lessonProgress._id },
//             {
//                 $set: {
//                     quizPassed,
//                     quizScore: correctAnswers,
//                     quizTotal: totalQuestions,
//                     quizPercentage: Math.round(scorePercentage * 100) / 100,
//                     updatedAt: new Date()
//                 }
//             }
//         );

//         // Check and update lesson completion status
//         await checkAndUpdateLessonCompletion(enrollmentId, lessonId);

//         return {
//             success: true,
//             message: `Quiz progress updated successfully. Score: ${correctAnswers}/${totalQuestions} (${Math.round(scorePercentage)}%)`
//         };
//     } catch (error: any) {
//         console.error("Error updating quiz progress:", error);
//         return { success: false, message: error?.message || "Failed to update quiz progress" };
//     }
// };
// /**
//  * Check and update lesson completion status
//  * Lesson is complete only if video is fully watched (100%) and quiz is passed
//  */
// const checkAndUpdateLessonCompletion = async (
//     enrollmentId: string,
//     lessonId: string
// ): Promise<void> => {
//     const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

//     const lessonProgress = await lessonProgressCollection.findOne({
//         enrollmentId: new ObjectId(enrollmentId),
//         lessonId: new ObjectId(lessonId)
//     });

//     if (!lessonProgress) return;

//     const videoComplete = lessonProgress.videoCompletionPercentage >= 100;
//     const isLessonCompleted = videoComplete && lessonProgress.quizPassed;

//     // Calculate lesson completion percentage (average of video and quiz for partial progress)
//     const quizPercentage = lessonProgress.quizPassed ? 100 : 0;
//     const lessonCompletionPercentage = isLessonCompleted ? 100 : (lessonProgress.videoCompletionPercentage + quizPercentage) / 2;

//     const update: any = {
//         isLessonCompleted,
//         lessonCompletionPercentage,
//         updatedAt: new Date()
//     };
//     if (isLessonCompleted && !lessonProgress.completedAt) {
//         update.completedAt = new Date();
//     } else if (!isLessonCompleted && lessonProgress.completedAt) {
//         update.completedAt = null;
//     }

//     await lessonProgressCollection.updateOne(
//         { _id: lessonProgress._id },
//         { $set: update }
//     );

//     if (lessonProgress.isLessonCompleted !== isLessonCompleted) {
//         // Update chapter progress if completion status changed
//         await updateChapterProgress(enrollmentId, lessonProgress.chapterId.toString());
//     }
// };

// /**
//  * Update chapter progress based on lesson completions
//  */
// const updateChapterProgress = async (
//     enrollmentId: string,
//     chapterId: string
// ): Promise<void> => {
//     const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);
//     const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
//     const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

//     const chapterProgress = await chapterProgressCollection.findOne({
//         enrollmentId: new ObjectId(enrollmentId),
//         chapterId: new ObjectId(chapterId)
//     });

//     if (!chapterProgress) return;

//     const lessonProgresses = await lessonProgressCollection.find({
//         enrollmentId: new ObjectId(enrollmentId),
//         chapterId: new ObjectId(chapterId)
//     }).toArray();

//     const completedLessons = lessonProgresses.filter(lp => lp.isLessonCompleted).length;
//     const chapterCompletionPercentage = (completedLessons / chapterProgress.totalLessons) * 100;

//     await chapterProgressCollection.updateOne(
//         { _id: chapterProgress._id },
//         {
//             $set: {
//                 completedLessons,
//                 chapterCompletionPercentage,
//                 lastUpdatedAt: new Date(),
//                 updatedAt: new Date()
//             }
//         }
//     );

//     // Check if chapter completion status changed
//     const wasComplete = chapterProgress.chapterCompletionPercentage >= 100;
//     const isComplete = chapterCompletionPercentage >= 100;

//     if (isComplete && !wasComplete) {
//         // Add to completedChapters in enrollment
//         await enrollmentCollection.updateOne(
//             { _id: new ObjectId(enrollmentId) },
//             {
//                 //@ts-ignore
//                 $push: { completedChapters: new ObjectId(chapterId) },
//                 $set: { updatedAt: new Date() }
//             }
//         );
//     } else if (!isComplete && wasComplete) {
//         // Remove from completedChapters if reverted (rare, but for completeness)
//         await enrollmentCollection.updateOne(
//             { _id: new ObjectId(enrollmentId) },
//             {
//                 //@ts-ignore
//                 $pull: { completedChapters: new ObjectId(chapterId) },
//                 $set: { updatedAt: new Date() }
//             }
//         );
//     }

//     // Update course progress
//     await updateCourseProgress(enrollmentId);
// };

// /**
//  * Update overall course progress based on chapter completions
//  */
// const updateCourseProgress = async (
//     enrollmentId: string
// ): Promise<void> => {
//     const courseProgressCollection = await getCollection(COURSE_PROGRESS_COLLECTION);
//     const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);
//     const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

//     const courseProgress = await courseProgressCollection.findOne({
//         enrollmentId: new ObjectId(enrollmentId)
//     });

//     if (!courseProgress) return;

//     const chapterProgresses = await chapterProgressCollection.find({
//         enrollmentId: new ObjectId(enrollmentId)
//     }).toArray();

//     const completedChapters = chapterProgresses.filter(cp => cp.chapterCompletionPercentage >= 100).length;
//     const overallProgress = (completedChapters / courseProgress.totalChapters) * 100;

//     await courseProgressCollection.updateOne(
//         { _id: courseProgress._id },
//         {
//             $set: {
//                 completedChapters,
//                 overallProgress,
//                 updatedAt: new Date()
//             }
//         }
//     );

//     // Update enrollment overall progress
//     await enrollmentCollection.updateOne(
//         { _id: new ObjectId(enrollmentId) },
//         {
//             $set: {
//                 overallProgress,
//                 updatedAt: new Date()
//             }
//         }
//     );

//     // Optional: If course is complete, update status to "completed" and issue certificate
//     // For now, assuming separate logic for certificate issuance
//     if (overallProgress >= 100) {
//         await enrollmentCollection.updateOne(
//             { _id: new ObjectId(enrollmentId) },
//             {
//                 $set: {
//                     status: "completed",
//                     certificateIssued: true, // Assuming auto-issue; adjust as needed
//                     updatedAt: new Date()
//                 }
//             }
//         );
//     }
// };


/**
 * Update video progress for a lesson
 */
export const updateVideoProgressFN = async (
    enrollmentId: string,
    lessonId: string,
    watchedSeconds: number,
    studentId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const lessonProgress = await lessonProgressCollection.findOne({
            enrollmentId: new ObjectId(enrollmentId),
            lessonId: new ObjectId(lessonId),
            studentId: new ObjectId(studentId)
        });

        console.log(lessonProgress, "sss")

        if (!lessonProgress) {
            return { success: false, message: "Lesson progress not found" };
        }

        // Update to the maximum watched seconds
        const newWatchedSeconds = Math.max(lessonProgress.videoWatchedSeconds, watchedSeconds);
        const videoCompletionPercentage = Math.min(100, (newWatchedSeconds / lessonProgress.videoTotalSeconds) * 100);

        await lessonProgressCollection.updateOne(
            { _id: lessonProgress._id },
            {
                $set: {
                    videoWatchedSeconds: newWatchedSeconds,
                    videoCompletionPercentage,
                    lastWatchedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        // IMPORTANT: Always update lesson completion - even for partial progress
        await checkAndUpdateLessonCompletion(enrollmentId, lessonId);

        return { success: true, message: "Video progress updated successfully" };
    } catch (error: any) {
        console.error("Error updating video progress:", error);
        return { success: false, message: error?.message || "Failed to update video progress" };
    }
};

/**
 * Update quiz progress for a lesson
 * Student must score 80% or above to pass (configurable via passPercentage constant)
 */
export const updateQuizProgressFN = async (
    enrollmentId: string,
    lessonId: string,
    correctAnswers: number,
    totalQuestions: number
): Promise<{ success: boolean; message: string }> => {
    try {
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
        const lessonCollection = await getCollection(LESSONS_COLLECTION);

        const lessonProgress = await lessonProgressCollection.findOne({
            enrollmentId: new ObjectId(enrollmentId),
            lessonId: new ObjectId(lessonId),
        });

        if (!lessonProgress) {
            return { success: false, message: "Lesson progress not found" };
        }

        // Once passed, never downgrade
        if (lessonProgress.quizPassed === true) {
            return { success: true, message: "Quiz already passed — no further updates allowed" };
        }

        const lesson = await lessonCollection.findOne({ _id: new ObjectId(lessonId) });
        if (!lesson) {
            return { success: false, message: "Lesson not found" };
        }

        // ── Condition 1: score-based pass ────────────────────
        const scorePercentage = totalQuestions > 0
            ? (correctAnswers / totalQuestions) * 100
            : 0;
        const scorePassed = scorePercentage >= passPercentage;

        // ── Condition 2: all POST attempts exhausted ─────────
        // remaingPostQuizAttempts is decremented BEFORE this function is called
        // inside submitQuizAnswers, so checking 0 here is correct.
        const remainingPostAttempts = lessonProgress.remaingPostQuizAttempts ?? 0;
        const attemptsPassed = remainingPostAttempts <= 0;

        const quizPassed = scorePassed || attemptsPassed;

        let passReason = "In progress";
        if (scorePassed) passReason = `Passed with ${Math.round(scorePercentage)}% score`;
        else if (attemptsPassed) passReason = "All attempts used — marked as completed";

        await lessonProgressCollection.updateOne(
            { _id: lessonProgress._id },
            {
                $set: {
                    quizPassed,
                    quizScore: correctAnswers,
                    quizTotal: totalQuestions,
                    quizPercentage: Math.round(scorePercentage * 100) / 100,
                    updatedAt: new Date(),
                },
            }
        );

        // Always check lesson completion after every attempt
        await checkAndUpdateLessonCompletion(enrollmentId, lessonId);

        return {
            success: true,
            message: `Quiz progress updated. ${passReason}. Score: ${correctAnswers}/${totalQuestions} (${Math.round(scorePercentage)}%)`,
        };
    } catch (error: any) {
        console.error("Error updating quiz progress:", error);
        return { success: false, message: error?.message || "Failed to update quiz progress" };
    }
};


// export const updateQuizProgressFN = async (
//     enrollmentId: string,
//     lessonId: string,
//     correctAnswers: number,
//     totalQuestions: number
// ): Promise<{ success: boolean; message: string }> => {
//     try {
//         const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
//         const lessonCollection = await getCollection(LESSONS_COLLECTION);

//         const lessonProgress = await lessonProgressCollection.findOne({
//             enrollmentId: new ObjectId(enrollmentId),
//             lessonId: new ObjectId(lessonId)
//         });

//         if (!lessonProgress) {
//             return { success: false, message: "Lesson progress not found" };
//         }

//         if (lessonProgress.quizPassed === true) {
//             return {
//                 success: true,
//                 message: "Quiz already passed — no further updates allowed"
//             };
//         }

//         const lesson = await lessonCollection.findOne({ _id: new ObjectId(lessonId) });
//         if (!lesson) {
//             return { success: false, message: "Lesson not found" };
//         }

//         // Calculate percentage score
//         const scorePercentage = totalQuestions > 0
//             ? (correctAnswers / totalQuestions) * 100
//             : 0;

//         // Check if student passed (80% or above)
//         const quizPassed = scorePercentage >= passPercentage;

//         await lessonProgressCollection.updateOne(
//             { _id: lessonProgress._id },
//             {
//                 $set: {
//                     quizPassed,
//                     quizScore: correctAnswers,
//                     quizTotal: totalQuestions,
//                     quizPercentage: Math.round(scorePercentage * 100) / 100,
//                     updatedAt: new Date()
//                 }
//             }
//         );

//         // IMPORTANT: Always update lesson completion - even for partial progress
//         await checkAndUpdateLessonCompletion(enrollmentId, lessonId);

//         return {
//             success: true,
//             message: `Quiz progress updated successfully. Score: ${correctAnswers}/${totalQuestions} (${Math.round(scorePercentage)}%)`
//         };
//     } catch (error: any) {
//         console.error("Error updating quiz progress:", error);
//         return { success: false, message: error?.message || "Failed to update quiz progress" };
//     }
// };

/**
 * Check and update lesson completion status
 * Lesson is complete only if video is fully watched (100%) and quiz is passed
 * BUT we track partial progress continuously (10%, 20%, 30%...100%)
 */
const checkAndUpdateLessonCompletion = async (
    enrollmentId: string,
    lessonId: string
): Promise<void> => {
    const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

    const lessonProgress = await lessonProgressCollection.findOne({
        enrollmentId: new ObjectId(enrollmentId),
        lessonId: new ObjectId(lessonId)
    });

    if (!lessonProgress) return;

    const videoComplete = lessonProgress.videoCompletionPercentage >= 100;
    const isLessonCompleted = videoComplete && lessonProgress.quizPassed;

    // Calculate lesson completion percentage (average of video and quiz for partial progress)
    // This will now show 10%, 20%, 30%...100% as student progresses
    const quizPercentage = lessonProgress.quizPassed ? 100 : (lessonProgress.quizPercentage || 0);
    const lessonCompletionPercentage = isLessonCompleted
        ? 100
        : Math.round(((lessonProgress.videoCompletionPercentage || 0) + quizPercentage) / 2);

    const update: any = {
        isLessonCompleted,
        lessonCompletionPercentage,
        updatedAt: new Date()
    };

    if (isLessonCompleted && !lessonProgress.completedAt) {
        update.completedAt = new Date();
    } else if (!isLessonCompleted && lessonProgress.completedAt) {
        update.completedAt = null;
    }

    await lessonProgressCollection.updateOne(
        { _id: lessonProgress._id },
        { $set: update }
    );

    // ALWAYS update chapter progress - not just when completion status changes
    // This ensures incremental progress (10%, 20%, 30%...100%)
    await updateChapterProgress(enrollmentId, lessonProgress.chapterId.toString());
};

/**
 * Update chapter progress based on lesson completions
 * Now tracks incremental progress: 10%, 20%, 30%...100%
 */
const updateChapterProgress = async (
    enrollmentId: string,
    chapterId: string
): Promise<void> => {
    const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);
    const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
    const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

    const chapterProgress = await chapterProgressCollection.findOne({
        enrollmentId: new ObjectId(enrollmentId),
        chapterId: new ObjectId(chapterId)
    });

    if (!chapterProgress) return;

    const lessonProgresses = await lessonProgressCollection.find({
        enrollmentId: new ObjectId(enrollmentId),
        chapterId: new ObjectId(chapterId)
    }).toArray();

    const completedLessons = lessonProgresses.filter(lp => lp.isLessonCompleted).length;

    // Calculate weighted chapter completion based on all lesson progress
    // This will show incremental progress like 10%, 20%, 30%...100%
    const totalLessons = chapterProgress.totalLessons || lessonProgresses.length;
    let cumulativeProgress = 0;

    lessonProgresses.forEach(lp => {
        cumulativeProgress += (lp.lessonCompletionPercentage || 0);
    });

    const chapterCompletionPercentage = totalLessons > 0
        ? Math.round(cumulativeProgress / totalLessons)
        : 0;

    await chapterProgressCollection.updateOne(
        { _id: chapterProgress._id },
        {
            $set: {
                completedLessons,
                chapterCompletionPercentage,
                lastUpdatedAt: new Date(),
                updatedAt: new Date()
            }
        }
    );

    // Check if chapter completion status changed
    const wasComplete = chapterProgress.chapterCompletionPercentage >= 100;
    const isComplete = chapterCompletionPercentage >= 100;

    if (isComplete && !wasComplete) {
        // Add to completedChapters in enrollment
        await enrollmentCollection.updateOne(
            { _id: new ObjectId(enrollmentId) },
            {
                //@ts-ignore
                $push: { completedChapters: new ObjectId(chapterId) },
                $set: { updatedAt: new Date() }
            }
        );
    } else if (!isComplete && wasComplete) {
        // Remove from completedChapters if reverted (rare, but for completeness)
        await enrollmentCollection.updateOne(
            { _id: new ObjectId(enrollmentId) },
            {
                //@ts-ignore
                $pull: { completedChapters: new ObjectId(chapterId) },
                $set: { updatedAt: new Date() }
            }
        );
    }

    // ALWAYS update course progress - not just when chapter completes
    // This ensures incremental updates at 10%, 20%, 30%...100%
    await updateCourseProgress(enrollmentId);
};

/**
 * Update overall course progress based on chapter completions
 * Now tracks incremental progress: 10%, 20%, 30%...100%
 */
const updateCourseProgress = async (
    enrollmentId: string
): Promise<void> => {
    const courseProgressCollection = await getCollection(COURSE_PROGRESS_COLLECTION);
    const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);
    const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

    const courseProgress = await courseProgressCollection.findOne({
        enrollmentId: new ObjectId(enrollmentId)
    });

    if (!courseProgress) return;

    const chapterProgresses = await chapterProgressCollection.find({
        enrollmentId: new ObjectId(enrollmentId)
    }).toArray();

    const completedChapters = chapterProgresses.filter(cp => cp.chapterCompletionPercentage >= 100).length;

    // Calculate weighted overall progress based on all chapter progress
    // This will show incremental progress like 10%, 20%, 30%...100%
    const totalChapters = courseProgress.totalChapters || chapterProgresses.length;
    let cumulativeProgress = 0;

    chapterProgresses.forEach(cp => {
        cumulativeProgress += (cp.chapterCompletionPercentage || 0);
    });

    const overallProgress = totalChapters > 0
        ? Math.round(cumulativeProgress / totalChapters)
        : 0;

    await courseProgressCollection.updateOne(
        { _id: courseProgress._id },
        {
            $set: {
                completedChapters,
                overallProgress,
                updatedAt: new Date()
            }
        }
    );

    // Update enrollment overall progress
    await enrollmentCollection.updateOne(
        { _id: new ObjectId(enrollmentId) },
        {
            $set: {
                overallProgress,
                updatedAt: new Date()
            }
        }
    );

    // Optional: If course is complete, update status to "completed" and issue certificate
    if (overallProgress >= 100) {
        await enrollmentCollection.updateOne(
            { _id: new ObjectId(enrollmentId) },
            {
                $set: {
                    status: "completed",
                    certificateIssued: true,
                    updatedAt: new Date()
                }
            }
        );
    }
};