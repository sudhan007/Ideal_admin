import { getCollection } from "@lib/config/db.config";
import { CHAPTER_COLLECTION, COURSE_ENROLLMENT_COLLECTION, LESSON_COLLECTION, LESSON_PROGRESS_COLLECTION } from "@lib/Db_collections";
import { ObjectId } from "mongodb";
export interface ChapterProgress {
    chapterId: any;
    chapterName: string;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number; // 0-100
    lessons: {
        lessonId: any;
        lessonName: string;
        videoCompleted: boolean;
        quizCompleted: boolean;
        overallCompleted: boolean;
    }[];
}

export const updateVideoProgress = async (
    enrollmentId: string,
    lessonId: string,
    watchedDuration: number,
    totalDuration: number,
    lastWatchedPosition: number
): Promise<{ success: boolean; message: string }> => {
    try {
        const progressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const watchedPercentage = totalDuration > 0
            ? Math.min(100, (watchedDuration / totalDuration) * 100)
            : 0;

        const isVideoCompleted = watchedPercentage >= 90; // Consider 90% as completed

        const updateData = {
            "videoProgress.totalDuration": totalDuration,
            "videoProgress.watchedDuration": watchedDuration,
            "videoProgress.watchedPercentage": watchedPercentage,
            "videoProgress.lastWatchedPosition": lastWatchedPosition,
            "videoProgress.isCompleted": isVideoCompleted,
            lastAccessedAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await progressCollection.findOneAndUpdate(
            {
                enrollmentId: new ObjectId(enrollmentId),
                lessonId: new ObjectId(lessonId),
            },
            { $set: updateData },
            { returnDocument: "after" }
        );

        if (!result) {
            return { success: false, message: "Progress record not found" };
        }

        // Check if lesson is now completed (video + quiz)
        await checkAndUpdateLessonCompletion(enrollmentId, lessonId);

        // Update overall course progress
        await updateCourseProgress(enrollmentId);

        return { success: true, message: "Video progress updated successfully" };
    } catch (error: any) {
        console.error("Error updating video progress:", error);
        return {
            success: false,
            message: error?.message || "Failed to update video progress",
        };
    }
};

/**
 * Update lesson quiz progress
 */
export const updateQuizProgress = async (
    enrollmentId: string,
    lessonId: string,
    passed: boolean,
    score: number,
    totalQuestions: number,
    correctAnswers: number
): Promise<{ success: boolean; message: string }> => {
    try {
        const progressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const updateData = {
            "quizProgress.attempted": true,
            "quizProgress.passed": passed,
            "quizProgress.score": score,
            "quizProgress.totalQuestions": totalQuestions,
            "quizProgress.correctAnswers": correctAnswers,
            "quizProgress.attemptedAt": new Date(),
            lastAccessedAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await progressCollection.findOneAndUpdate(
            {
                enrollmentId: new ObjectId(enrollmentId),
                lessonId: new ObjectId(lessonId),
            },
            { $set: updateData },
            { returnDocument: "after" }
        );

        if (!result) {
            return { success: false, message: "Progress record not found" };
        }

        // Check if lesson is now completed (video + quiz)
        await checkAndUpdateLessonCompletion(enrollmentId, lessonId);

        // Update overall course progress
        await updateCourseProgress(enrollmentId);

        return { success: true, message: "Quiz progress updated successfully" };
    } catch (error: any) {
        console.error("Error updating quiz progress:", error);
        return {
            success: false,
            message: error?.message || "Failed to update quiz progress",
        };
    }
};

const checkAndUpdateLessonCompletion = async (
    enrollmentId: string,
    lessonId: string
): Promise<void> => {
    try {
        const progressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const progress = await progressCollection.findOne({
            enrollmentId: new ObjectId(enrollmentId),
            lessonId: new ObjectId(lessonId),
        });

        if (!progress) return;

        const isCompleted =
            progress.videoProgress.isCompleted && progress.quizProgress.passed;

        if (isCompleted && !progress.lessonCompleted) {
            await progressCollection.updateOne(
                {
                    enrollmentId: new ObjectId(enrollmentId),
                    lessonId: new ObjectId(lessonId),
                },
                {
                    $set: {
                        lessonCompleted: true,
                        completedAt: new Date(),
                        updatedAt: new Date(),
                    },
                }
            );
        }
    } catch (error) {
        console.error("Error checking lesson completion:", error);
    }
};

/**
 * Update overall course progress
 */
const updateCourseProgress = async (enrollmentId: string): Promise<void> => {
    try {
        const progressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

        const enrollment = await enrollmentCollection.findOne({
            _id: new ObjectId(enrollmentId),
        });

        if (!enrollment) return;

        // Get all lesson progress for this enrollment
        const allProgress = await progressCollection
            .find({ enrollmentId: new ObjectId(enrollmentId) })
            .toArray();

        if (allProgress.length === 0) return;

        // Calculate overall progress
        const completedLessons = allProgress.filter((p) => p.lessonCompleted).length;
        const overallProgress = Math.round(
            (completedLessons / allProgress.length) * 100
        );

        // Get completed chapters
        const chapterProgress = await getChapterProgress(enrollmentId);
        const completedChapters = chapterProgress
            .filter((ch) => ch.progressPercentage === 100)
            .map((ch) => ch.chapterId);

        // Update enrollment
        await enrollmentCollection.updateOne(
            { _id: new ObjectId(enrollmentId) },
            {
                $set: {
                    overallProgress,
                    completedChapters,
                    lastAccessedAt: new Date(),
                    status: overallProgress === 100 ? "completed" : "active",
                },
            }
        );
    } catch (error) {
        console.error("Error updating course progress:", error);
    }
};
export const getChapterProgress = async (
    enrollmentId: string
): Promise<ChapterProgress[]> => {
    try {
        const progressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
        const chapterCollection = await getCollection(CHAPTER_COLLECTION);
        const lessonCollection = await getCollection(LESSON_COLLECTION);

        const enrollment = await getCollection(COURSE_ENROLLMENT_COLLECTION).then(
            (col) =>
                col.findOne({
                    _id: new ObjectId(enrollmentId),
                })
        );

        if (!enrollment) return [];

        // Get all chapters for this course
        const chapters = await chapterCollection
            .find({
                courseId: enrollment.courseId,
                isDeleted: false,
                isActive: true,
            })
            .sort({ order: 1 })
            .toArray();

        const chapterProgressData: ChapterProgress[] = [];

        for (const chapter of chapters) {
            // Get all lessons for this chapter
            const lessons = await lessonCollection
                .find({
                    chapterId: chapter._id,
                    isDeleted: false,
                    isActive: true,
                })
                .sort({ order: 1 })
                .toArray();

            // Get progress for these lessons
            const lessonIds = lessons.map((l) => l._id);
            const progressRecords = await progressCollection
                .find({
                    enrollmentId: new ObjectId(enrollmentId),
                    lessonId: { $in: lessonIds },
                })
                .toArray();

            const completedLessons = progressRecords.filter(
                (p) => p.lessonCompleted
            ).length;

            const progressPercentage =
                lessons.length > 0
                    ? Math.round((completedLessons / lessons.length) * 100)
                    : 0;

            const lessonDetails = lessons.map((lesson) => {
                const progress = progressRecords.find(
                    (p) => p.lessonId.toString() === lesson._id.toString()
                );

                return {
                    lessonId: lesson._id,
                    lessonName: lesson.lessonName,
                    videoCompleted: progress?.videoProgress.isCompleted || false,
                    quizCompleted: progress?.quizProgress.passed || false,
                    overallCompleted: progress?.lessonCompleted || false,
                };
            });

            chapterProgressData.push({
                chapterId: chapter._id,
                chapterName: chapter.chapterName,
                totalLessons: lessons.length,
                completedLessons,
                progressPercentage,
                lessons: lessonDetails,
            });
        }

        return chapterProgressData;
    } catch (error) {
        console.error("Error getting chapter progress:", error);
        return [];
    }
};

/**
 * Get student's course enrollment with progress
 */
export const getStudentCourseEnrollment = async (
    studentId: string,
    courseId: string
): Promise<any> => {
    try {
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

        const enrollment = await enrollmentCollection.findOne({
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
            isDeleted: false,
        });

        if (!enrollment) {
            return null;
        }

        const chapterProgress = await getChapterProgress(
            enrollment._id.toString()
        );

        return {
            ...enrollment,
            chapterProgress,
        };
    } catch (error) {
        console.error("Error getting student enrollment:", error);
        return null;
    }
};