import { type Context } from "elysia";
import { CreateChapterInput, UpdateChapterInput } from "./chapters.model";
import { getCollection } from "@lib/config/db.config";
import { ObjectId } from "mongodb";
import { StoreType } from "@types";
import { CHAPTER_PROGRESS_COLLECTION, COURSE_ENROLLMENT_COLLECTION, COURSE_COLLECTION, CHAPTERS_COLLECTION } from "@lib/Db_collections";
import { createChapterProgressForExistingEnrollments } from "@lib/utils/course-enrollment";


export const createChapter = async (ctx: Context<{ body: CreateChapterInput }>) => {
    const { body, set } = ctx;
    const { courseId, chapterName, chapterDescription, order } = body
    try {
        const courseCollection = await getCollection(COURSE_COLLECTION);
        const course = await courseCollection.findOne({ _id: new ObjectId(courseId), isDeleted: false, isActive: true });
        if (!course) {
            set.status = 404;
            return { error: "Course not found" };
        }
        const chapterCollection = await getCollection(CHAPTERS_COLLECTION);
        const data = {
            courseId: new ObjectId(courseId),
            chapterName,
            chapterDescription,
            order,
            isDeleted: false,
            isActive: true
        }
        const chapter = await chapterCollection.insertOne(data);

        await createChapterProgressForExistingEnrollments(
            courseId,
            chapter.insertedId.toString()
        );

        set.status = 201;
        return {
            message: "Chapter created successfully",
            chapterId: chapter.insertedId,
        }
    } catch (error) {
        set.status = 500;
        return { error: "Failed to create chapter", status: false };
    }
}
export const updateChapter = async (ctx: Context<{ body: UpdateChapterInput, params: { chapterId: string } }>) => {
    const { body, params, set } = ctx;
    const { chapterId } = params;
    const { courseId, chapterName, chapterDescription, order } = body
    try {
        const chapterCollection = await getCollection(CHAPTERS_COLLECTION);
        const chapter = await chapterCollection.findOne({ _id: new ObjectId(chapterId), isDeleted: false });
        if (!chapter) {
            set.status = 404;
            return { error: "Chapter not found" };
        }
        const courseCollection = await getCollection(COURSE_COLLECTION);
        const course = await courseCollection.findOne({ _id: new ObjectId(courseId), isDeleted: false, isActive: true });
        if (!course) {
            set.status = 404;
            return { error: "Course not found" };
        }
        const data = {
            courseId: new ObjectId(courseId),
            chapterName,
            chapterDescription,
            order,
        }
        await chapterCollection.updateOne({ _id: new ObjectId(chapterId) }, { $set: data });
        set.status = 200;
        return {
            message: "Chapter updated successfully",
        }
    } catch (error) {
        set.status = 500;
        return { error: "Failed to update chapter", status: false };
    }
}
export const getAllChaptersByCourseId = async (ctx: Context<{ params: { courseId: string }, query: { isExam?: string } }>) => {
    const { params, set, store, query } = ctx;
    const { courseId } = params;
    const { isExam } = query
    const { id, role } = store as StoreType;
    const isExamMode = isExam === "true"
    try {
        const chapterCollection = await getCollection(CHAPTERS_COLLECTION);

        // Fetch chapters - common for all roles
        const chapters = await chapterCollection
            .find({
                courseId: new ObjectId(courseId),
                isDeleted: false,
                isActive: true
            })
            .sort({ order: 1 })
            .project({
                _id: 1,
                chapterName: 1,
                chapterDescription: 1,
                order: 1
            })
            .toArray();

        // For ADMIN and STAFF, return chapters without any restrictions
        if (role === "ADMIN") {
            set.status = 200;
            return {
                chapters,
                message: "Chapters fetched successfully"
            };
        }

        // For STUDENT role - check enrollment and progress
        if (role === "STUDENT") {

            if (isExamMode) {
                set.status = 200;
                return {
                    chapters,
                    message: "Chapters fetched successfully (Exam Mode)"
                };
            }
            const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
            const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);



            // Check enrollment status
            const enrollment = await enrollmentCollection.findOne({
                studentId: new ObjectId(id),
                courseId: new ObjectId(courseId),
                // status: "active"
            });

            // If not enrolled, all chapters are locked
            if (!enrollment) {
                set.status = 200;
                return {
                    chapters,
                    message: "Chapters fetched successfully"
                };
            }

            // Student is enrolled - fetch all chapter progress data in one query
            const chapterIds = chapters.map(c => c._id);
            const progressData = await chapterProgressCollection
                .find({
                    enrollmentId: enrollment._id,
                    chapterId: { $in: chapterIds }
                })
                .project({
                    chapterId: 1,
                    totalLessons: 1,
                    completedLessons: 1,
                    chapterCompletionPercentage: 1
                })
                .toArray();

            // Create a map for quick lookup
            const progressMap = new Map(
                progressData.map(p => [
                    p.chapterId.toString(),
                    {
                        totalLessons: p.totalLessons || 0,
                        completedLessons: p.completedLessons || 0,
                        completionPercentage: p.chapterCompletionPercentage || 0
                    }
                ])
            );

            // Process chapters with locking logic
            const processedChapters = chapters.map((chapter, index) => {
                const progress = progressMap.get(chapter._id.toString()) || {
                    totalLessons: 0,
                    completedLessons: 0,
                    completionPercentage: 0
                };

                // First chapter is always unlocked
                if (index === 0) {
                    return {
                        ...chapter,
                        isLocked: false,
                        completionPercentage: progress.completionPercentage,
                        totalLessons: progress.totalLessons,
                        completedLessons: progress.completedLessons
                    };
                }

                // For subsequent chapters, check if previous chapter is 100% completed
                const previousChapter = chapters[index - 1];
                const previousProgress = progressMap.get(previousChapter._id.toString()) || {
                    totalLessons: 0,
                    completedLessons: 0,
                    completionPercentage: 0
                };

                // Chapter is locked if previous chapter is not 100% complete
                const isLocked = previousProgress.completionPercentage < 100;

                return {
                    ...chapter,
                    isLocked,
                    completionPercentage: progress.completionPercentage,
                    totalLessons: progress.totalLessons,
                    completedLessons: progress.completedLessons
                };
            });

            set.status = 200;
            return {
                chapters: processedChapters,
                message: "Chapters fetched successfully"
            };
        }

        // Fallback for unknown roles
        set.status = 200;
        return {
            chapters: chapters.map(chapter => ({
                ...chapter,
                isLocked: true,
                completionPercentage: 0,
                totalLessons: 0,
                completedLessons: 0
            })),
            message: "Chapters fetched successfully"
        };

    } catch (error) {
        console.error("Error fetching chapters:", error);
        set.status = 500;
        return { error: "Failed to get chapters", status: false };
    }
}
export const getAllChaptersDropDown = async (ctx: Context<{ params: { courseId: string } }>) => {
    const { params, set, } = ctx;
    const { courseId } = params;

    try {
        const chapterCollection = await getCollection(CHAPTERS_COLLECTION);

        const chapters = await chapterCollection
            .find({
                courseId: new ObjectId(courseId),
                isDeleted: false,
                isActive: true
            })
            .sort({ order: 1 })
            .project({
                _id: 1,
                chapterName: 1,
                order: 1
            })
            .toArray();

        set.status = 200;
        return {
            chapters,
            message: "Chapters fetched successfully"
        };

    } catch (error) {
        console.error("Error fetching chapters:", error);
        set.status = 500;
        return { error: "Failed to get chapters", status: false };
    }
}
export const toggelChapterStatusById = async (ctx: Context<{ params: { chapterId: string } }>) => {
    const { params, set } = ctx;
    const { chapterId } = params;
    try {
        const chapterCollection = await getCollection(CHAPTERS_COLLECTION);
        const chapter = await chapterCollection.findOne({ _id: new ObjectId(chapterId), isDeleted: false });
        if (!chapter) {
            set.status = 404;
            return { error: "Chapter not found" };
        }
        const newStatus = !chapter.isActive;
        const result = await chapterCollection.updateOne(
            { _id: new ObjectId(chapterId) },
            { $set: { isActive: newStatus } }
        );
        if (result.modifiedCount === 0) {
            set.status = 500;
            return { error: "Failed to update chapter status" };
        }
        return {
            message: `Chapter has been ${newStatus ? 'activated' : 'deactivated'} successfully`,
        };
    } catch (error) {
        console.log(error);
        set.status = 500;
        return { error: "Failed to deactivate chapter" };
    }
}
export const deleteChapterById = async (ctx: Context<{ params: { chapterId: string } }>) => {
    const { params, set } = ctx;
    const { chapterId } = params;
    try {
        const chapterCollection = await getCollection(CHAPTERS_COLLECTION);
        const result = await chapterCollection.updateOne(
            { _id: new ObjectId(chapterId) },
            { $set: { isDeleted: true } }
        );
        if (result.modifiedCount === 0) {
            set.status = 404;
            return { error: "Chapter not found" };
        }
        return {
            message: "Chapter deleted successfully",
        };
    } catch (error) {
        console.log(error);
        set.status = 500;
        return { error: "Failed to delete chapter" };
    }
}
