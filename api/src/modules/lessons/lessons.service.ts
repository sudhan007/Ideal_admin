import { Context } from "elysia";
import { getCollection } from "@lib/config/db.config";
import { CreateLessonInput, UpdateLessonInput } from "./lessons.model";
import { ObjectId } from "mongodb";
import { StoreType } from "@types";
import { COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, EXAM_COLLECTION, LESSONS_COLLECTION, LESSON_PROGRESS_COLLECTION } from "@lib/Db_collections";
import { createLessonProgressForExistingEnrollments } from "@lib/utils/course-enrollment";

// export const createLesson = async (ctx: Context<{ body: CreateLessonInput }>) => {
//     const { body, set } = ctx;
//     const { courseId, chapterId, lessonName, order, videoUrl, duration, accurateSeconds, } = body

//     try {
//         const lessonsCollection = await getCollection(LESSONS_COLLECTION);
//         const coursesCollection = await getCollection(COURSE_COLLECTION);

//         const lessonDuration = Number(duration);
//         const _accurateSeconds = Number(accurateSeconds);

//         const payload = {
//             courseId: new ObjectId(courseId),
//             chapterId: new ObjectId(chapterId),
//             lessonName,
//             order,
//             videoUrl,
//             duration: lessonDuration,
//             isActive: true,
//             isDeleted: false,
//             accurateSeconds: _accurateSeconds,
//             createdAt: new Date(),
//             updatedAt: new Date()
//         }

//         const lesson = await lessonsCollection.insertOne(payload);

//         await coursesCollection.updateOne(
//             { _id: new ObjectId(courseId), isDeleted: false, isActive: true },
//             {
//                 $inc: {
//                     courseDurationMinutes: lessonDuration,
//                 },
//                 $set: {
//                     updatedAt: new Date(),
//                 },
//             }
//         );

//         set.status = 201
//         return {
//             message: "Lesson created successfully",
//             lessonId: lesson.insertedId,
//         }

//     } catch (error) {
//         console.log(error)
//         set.status = 500
//         return { error: "Failed to create lesson", status: false }
//     }
// }
// export const updateLesson = async (
//     ctx: Context<{ body: UpdateLessonInput; params: { lessonId: string } }>
// ) => {
//     const { body, params, set } = ctx;
//     const { lessonId } = params;
//     const { courseId, chapterId, lessonName, order, videoUrl, duration,_accurateSeconds } = body;

//     try {
//         const lessonsCollection = await getCollection(LESSONS_COLLECTION);
//         const coursesCollection = await getCollection(COURSE_COLLECTION);


//         const existingLesson = await lessonsCollection.findOne({
//             _id: new ObjectId(lessonId),
//             isDeleted: false,
//         });

//         if (!existingLesson) {
//             set.status = 404;
//             return { message: "Lesson not found" };
//         }

//         const oldDuration = existingLesson.duration || 0;
//         const newDuration = Number(duration);
//         const durationDiff = newDuration - oldDuration;


//         await lessonsCollection.updateOne(
//             { _id: new ObjectId(lessonId) },
//             {
//                 $set: {
//                     courseId: new ObjectId(courseId),
//                     chapterId: new ObjectId(chapterId),
//                     lessonName,
//                     order,
//                     videoUrl,
//                     duration: newDuration,
//                     updatedAt: new Date(),
//                 },
//             }
//         );


//         if (durationDiff !== 0) {
//             await coursesCollection.updateOne(
//                 { _id: new ObjectId(existingLesson.courseId), isDeleted: false },
//                 {
//                     $inc: { courseDurationMinutes: durationDiff },
//                     $set: { updatedAt: new Date() },
//                 }
//             );
//         }

//         set.status = 200;
//         return { message: "Lesson updated successfully" };
//     } catch (error) {
//         console.error(error);
//         set.status = 500;
//         return { error: "Failed to update lesson", status: false };
//     }
// };
export const createLesson = async (ctx: Context<{ body: CreateLessonInput }>) => {
    const { body, set } = ctx;
    const { courseId, chapterId, lessonName, order, videoUrl, duration, accurateSeconds, preQuizAttempt, postQuizAttempt } = body;
    console.log(body, "body")
    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const coursesCollection = await getCollection(COURSE_COLLECTION);

        const lessonDuration = Number(duration);
        const exactSeconds = Number(accurateSeconds);
        const _preQuizAttempt = Number(preQuizAttempt);
        const _postQuizAttempt = Number(postQuizAttempt)
        const payload = {
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonName,
            order,
            videoUrl,
            duration: lessonDuration, // Rounded minutes
            accurateSeconds: exactSeconds, // Exact seconds
            isActive: true,
            isDeleted: false,
            preQuizAttempt: _preQuizAttempt,
            postQuizAttempt: _postQuizAttempt,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const lesson = await lessonsCollection.insertOne(payload);

        await coursesCollection.updateOne(
            { _id: new ObjectId(courseId), isDeleted: false, isActive: true },
            {
                $inc: {
                    courseDurationMinutes: lessonDuration,
                },
                $set: {
                    updatedAt: new Date(),
                },
            }
        );

        await createLessonProgressForExistingEnrollments(
            courseId,
            chapterId,
            lesson.insertedId.toString(),
            exactSeconds,
            _preQuizAttempt,
            _postQuizAttempt
        );

        set.status = 201;
        return {
            message: "Lesson created successfully",
            lessonId: lesson.insertedId,
        };

    } catch (error) {
        console.log(error);
        set.status = 500;
        return { error: "Failed to create lesson", status: false };
    }
};
export const updateLesson = async (
    ctx: Context<{ body: UpdateLessonInput; params: { lessonId: string } }>
) => {
    const { body, params, set } = ctx;
    const { lessonId } = params;
    const { courseId, chapterId, lessonName, order, videoUrl, duration, accurateSeconds } = body;

    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const coursesCollection = await getCollection(COURSE_COLLECTION);

        const existingLesson = await lessonsCollection.findOne({
            _id: new ObjectId(lessonId),
            isDeleted: false,
        });

        if (!existingLesson) {
            set.status = 404;
            return { message: "Lesson not found" };
        }

        const oldDuration = existingLesson.duration || 0;
        const newDuration = Number(duration);
        const durationDiff = newDuration - oldDuration;

        await lessonsCollection.updateOne(
            { _id: new ObjectId(lessonId) },
            {
                $set: {
                    courseId: new ObjectId(courseId),
                    chapterId: new ObjectId(chapterId),
                    lessonName,
                    order,
                    videoUrl,
                    duration: newDuration,
                    accurateSeconds: Number(accurateSeconds), // Store exact seconds
                    updatedAt: new Date(),
                },
            }
        );

        if (durationDiff !== 0) {
            await coursesCollection.updateOne(
                { _id: new ObjectId(existingLesson.courseId), isDeleted: false },
                {
                    $inc: { courseDurationMinutes: durationDiff },
                    $set: { updatedAt: new Date() },
                }
            );
        }

        set.status = 200;
        return { message: "Lesson updated successfully" };
    } catch (error) {
        console.error(error);
        set.status = 500;
        return { error: "Failed to update lesson", status: false };
    }
};
export const getAllLessonsByChapterId = async (ctx: Context<{ params: { chapterId: string }, query: { isExam?: string } }>) => {
    const { params, set, store, query } = ctx;
    const { chapterId } = params;
    const { isExam } = query
    const { id, role } = store as StoreType;
    const isExamMode = isExam === "true"

    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);


        const lessons = await lessonsCollection
            .find({
                chapterId: new ObjectId(chapterId),
                isDeleted: false,
                isActive: true
            })
            .sort({ order: 1 })
            .project({
                _id: 1,
                lessonName: 1,
                order: 1,
                videoUrl: 1,
                duration: 1,
                courseId: 1,
                accurateSeconds: 1,
                preQuizAttempt: 1,
                postQuizAttempt: 1
            })
            .toArray();

        if (role === "ADMIN") {
            set.status = 200;
            return {
                lessons,
                message: "Lessons fetched successfully"
            };
        }

        if (role === "STUDENT") {

            if (isExamMode) {
                set.status = 200;
                return {
                    lessons,
                    message: "Lessons fetched successfully (Exam Mode)"
                };
            }

            const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
            const progressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

            const courseId = lessons[0]?.courseId;
            console.log(lessons[0], "sss")
            if (!courseId) {
                set.status = 200;
                return {
                    lessons,
                    message: "Lessons fetched successfully"
                };
            }

            const enrollment = await enrollmentCollection.findOne({
                studentId: new ObjectId(id),
                courseId: new ObjectId(courseId),
                // status: "active"
            });
            // If not enrolled, all lessons are locked
            if (!enrollment) {
                set.status = 200;
                return {
                    lessons,
                    message: "Lessons fetched successfully"
                };
            }

            // Student is enrolled - fetch all progress data in one query
            const lessonIds = lessons.map(l => l._id);
            const progressData = await progressCollection
                .find({
                    enrollmentId: enrollment._id,
                    lessonId: { $in: lessonIds }
                })
                .project({
                    lessonId: 1,
                    lessonCompletionPercentage: 1,
                    isLessonCompleted: 1,
                    videoWatchedSeconds: 1,
                    videoCompletionPercentage: 1,
                    quizPercentage: 1,
                    remaingPreQuizAttempts: 1,
                    remaingPostQuizAttempts: 1,
                    isPreQuizAttempted: 1,
                })
                .toArray();

            // Create a map for quick lookup
            const progressMap = new Map(
                progressData.map(p => [
                    p.lessonId.toString(),
                    {
                        completionPercentage: p.lessonCompletionPercentage || 0,
                        isLessonCompleted: p.isLessonCompleted || false,
                        videoWatchedSeconds: p.videoWatchedSeconds || 0,
                        videoCompletionPercentage: p.videoCompletionPercentage || 0,
                        quizPercentage: p.quizPercentage || 0,
                        remaingPreQuizAttempts: p.remaingPreQuizAttempts || 0,
                        remaingPostQuizAttempts: p.remaingPostQuizAttempts || 0,
                        isPreQuizAttempted: p.isPreQuizAttempted
                    }
                ])
            );

            // Process lessons with locking logic
            const processedLessons = lessons.map((lesson, index) => {
                const progress = progressMap.get(lesson._id.toString()) || {
                    completionPercentage: 0,
                    isLessonCompleted: false,
                    videoWatchedSeconds: 0,
                    videoCompletionPercentage: 0,
                    quizPercentage: 0,
                    remaingPreQuizAttempts: 0,
                    remaingPostQuizAttempts: 0,
                    isPreQuizAttempted: false
                };

                // First lesson is always unlocked
                if (index === 0) {
                    return {
                        ...lesson,
                        isLocked: false,
                        completionPercentage: progress.completionPercentage,
                        isLessonCompleted: progress.isLessonCompleted,
                        videoWatchedSeconds: progress.videoWatchedSeconds,
                        videoCompletionPercentage: progress.videoCompletionPercentage,
                        quizPercentage: progress.quizPercentage,
                        remaingPreQuizAttempts: progress.remaingPreQuizAttempts,
                        remaingPostQuizAttempts: progress.remaingPostQuizAttempts,
                        isPreQuizAttempted: progress.isPreQuizAttempted
                    };
                }

                // For subsequent lessons, check if previous lesson is completed
                const previousLesson = lessons[index - 1];
                const previousProgress = progressMap.get(previousLesson._id.toString()) || {
                    completionPercentage: 0,
                    isLessonCompleted: false,
                    videoWatchedSeconds: 0,
                    videoCompletionPercentage: 0,
                    quizPercentage: 0,
                    remaingPreQuizAttempts: 0,
                    remaingPostQuizAttempts: 0,
                    isPreQuizAttempted: false
                };

                const isLocked = !previousProgress.isLessonCompleted;

                return {
                    ...lesson,
                    isLocked,
                    completionPercentage: progress.completionPercentage,
                    isLessonCompleted: progress.isLessonCompleted,
                    videoWatchedSeconds: progress.videoWatchedSeconds,
                    videoCompletionPercentage: progress.videoCompletionPercentage,
                    quizPercentage: progress.quizPercentage,
                    remaingPreQuizAttempts: progress.remaingPreQuizAttempts,
                    remaingPostQuizAttempts: progress.remaingPostQuizAttempts,
                    isPreQuizAttempted: progress.isPreQuizAttempted
                };
            });

            set.status = 200;
            return {
                lessons: processedLessons,
                message: "Lessons fetched successfully"
            };
        }

        set.status = 200;
        return {
            lessons: lessons.map(lesson => ({
                ...lesson,
                isLocked: true,
                completionPercentage: 0
            })),
            message: "Lessons fetched successfully"
        };

    } catch (error) {
        console.error("Error fetching lessons:", error);
        set.status = 500;
        return { error: "Failed to get lessons", status: false };
    }
}
export const getAllLessonsDropdown = async (ctx: Context<{ params: { chapterId: string } }>) => {
    const { params, set } = ctx;
    const { chapterId } = params;

    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);

        const lessons = await lessonsCollection
            .find({
                chapterId: new ObjectId(chapterId),
                isDeleted: false,
                isActive: true
            })
            .sort({ order: 1 })
            .project({
                _id: 1,
                lessonName: 1,
                order: 1,
            })
            .toArray();

        set.status = 200;
        return {
            lessons,
            message: "Lessons fetched successfully"
        };

    } catch (error) {
        console.error("Error fetching lessons:", error);
        set.status = 500;
        return { error: "Failed to get lessons", status: false };
    }
}
export const toggleLessonsStatusById = async (ctx: Context<{ params: { lessonId: string } }>) => {
    const { params, set } = ctx;
    const { lessonId } = params;
    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const lesson = await lessonsCollection.findOne({ _id: new ObjectId(lessonId), isDeleted: false });
        if (!lesson) {
            set.status = 404;
            return { error: "Lesson not found" };
        }
        const newStatus = !lesson.isActive;
        const result = await lessonsCollection.updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: { isActive: newStatus } }
        );
        if (result.modifiedCount === 0) {
            set.status = 500;
            return { error: "Failed to update lesson status" };
        }
        return {
            message: `Lesson ${newStatus ? "activated" : "deactivated"} successfully`,
        }
    } catch (error) {
        console.log(error);
        set.status = 500;
        return { error: "Failed to deactivate lesson" };
    }
}

export const deleteLesson = async (
    ctx: Context<{ params: { lessonId: string } }>
) => {
    const { params, set } = ctx;
    const { lessonId } = params;

    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const coursesCollection = await getCollection(COURSE_COLLECTION);
        const examsCollection = await getCollection(EXAM_COLLECTION);


        const lesson = await lessonsCollection.findOne({
            _id: new ObjectId(lessonId),
            isDeleted: false,
        });

        if (!lesson) {
            set.status = 404;
            return { message: "Lesson not found" };
        }

        const lessonObjectId = new ObjectId(lessonId);
        const courseId = new ObjectId(lesson.courseId);


        const lessonDeleteResult = await lessonsCollection.updateOne(
            { _id: lessonObjectId },
            {
                $set: {
                    isActive: false,
                    isDeleted: true,
                    updatedAt: new Date(),
                },
            }
        );

        if (lessonDeleteResult.modifiedCount === 0) {
            set.status = 500;
            return { error: "Failed to soft-delete lesson" };
        }

        const examsDeleteResult = await examsCollection.updateMany(
            {
                lessonId: lessonObjectId,
                isDeleted: false,
            },
            {
                $set: {
                    isActive: false,
                    isDeleted: true,
                    updatedAt: new Date(),
                },
            }
        );

        console.log(`Soft-deleted ${examsDeleteResult.modifiedCount} exam(s) for lesson ${lessonId}`);

        const lessonDuration = lesson.duration || 0;

        if (lessonDuration > 0) {
            await coursesCollection.updateOne(
                { _id: courseId, isDeleted: false },
                {
                    $inc: { courseDurationMinutes: -lessonDuration },
                    $set: { updatedAt: new Date() },
                }
            );
        }

        set.status = 200;
        return {
            message: "Lesson and associated exams deleted successfully",
            examsDeletedCount: examsDeleteResult.modifiedCount,
        };

    } catch (error) {
        console.error("Error in deleteLesson:", error);
        set.status = 500;
        return { error: "Internal server error while deleting lesson" };
    }
};

// export const deleteLesson = async (
//     ctx: Context<{ params: { lessonId: string } }>
// ) => {
//     const { params, set } = ctx;
//     const { lessonId } = params;

//     try {
//         const lessonsCollection = await getCollection(LESSONS_COLLECTION);
//         const coursesCollection = await getCollection(COURSE_COLLECTION);
//         const examsCollection   = await getCollection(EXAM_COLLECTION);   // ← add this

//         // Find the lesson to delete
//         const lesson = await lessonsCollection.findOne({
//             _id: new ObjectId(lessonId),
//             isDeleted: false,
//         });

//         if (!lesson) {
//             set.status = 404;
//             return { message: "Lesson not found" };
//         }

//         // Soft delete the lesson
//         const result = await lessonsCollection.updateOne(
//             { _id: new ObjectId(lessonId) },
//             {
//                 $set: {
//                     isActive: false,
//                     isDeleted: true,
//                     updatedAt: new Date(),
//                 },
//             }
//         );

//         if (result.modifiedCount === 0) {
//             set.status = 500;
//             return { error: "Failed to delete lesson" };
//         }

//         // Reduce course duration (use negative value for decrement)
//         const lessonDuration = lesson.duration || 0; // Safety check

//         if (lessonDuration > 0) {
//             await coursesCollection.updateOne(
//                 { _id: new ObjectId(lesson.courseId), isDeleted: false },
//                 {
//                     $inc: { courseDurationMinutes: -lessonDuration }, // Decrement
//                     $set: { updatedAt: new Date() },
//                 }
//             );
//         }

//         set.status = 200;
//         return { message: "Lesson deleted successfully" };
//     } catch (error) {
//         console.error(error);
//         set.status = 500;
//         return { error: "Failed to delete lesson", status: false };
//     }
// };
// export const deleteLesson = async (
//     ctx: Context<{ params: { lessonId: string } }>
// ) => {
//     const { params, set } = ctx;
//     const { lessonId } = params;

//     try {
//         const lessonsCollection = await getCollection(LESSONS_COLLECTION);
//         const coursesCollection = await getCollection(COURSE_COLLECTION);

//         const lesson = await lessonsCollection.findOne({
//             _id: new ObjectId(lessonId),
//             isDeleted: false,
//         });

//         if (!lesson) {
//             set.status = 404;
//             return { message: "Lesson not found" };
//         }

//         const result = await lessonsCollection.updateOne(
//             { _id: new ObjectId(lessonId) },
//             {
//                 $set: {
//                     isActive: false,
//                     isDeleted: true,
//                     updatedAt: new Date(),
//                 },
//             }
//         );

//         if (result.modifiedCount === 0) {
//             set.status = 500;
//             return { error: "Failed to delete lesson" };
//         }

//         // 3️⃣ Reduce course duration
//         await coursesCollection.updateOne(
//             { _id: new ObjectId(lesson.courseId), isDeleted: false },
//             {
//                 $inc: { courseDurationMinutes: -lesson.duration },
//                 $set: { updatedAt: new Date() },
//             }
//         );

//         set.status = 200;
//         return { message: "Lesson deleted successfully" };
//     } catch (error) {
//         console.error(error);
//         set.status = 500;
//         return { error: "Failed to delete lesson", status: false };
//     }
// };
