import { Context } from "elysia";
import { getCollection } from "@lib/config/db.config";
import { CreateLessonInput, LESSONS_COLLECTION, UpdateLessonInput } from "./lessons.model";
import { ObjectId } from "mongodb";

export const createLesson = async (ctx: Context<{ body: CreateLessonInput }>) => {
    const { body, set } = ctx;
    const { courseId, chapterId, lessonName, order, videoUrl, duration } = body

    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);

        const payload = {
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonName,
            order,
            videoUrl,
            duration: Number(duration),
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        set.status = 201
        const lesson = await lessonsCollection.insertOne(payload);
        return {
            message: "Lesson created successfully",
            lessonId: lesson.insertedId,
        }

    } catch (error) {
        console.log(error)
        set.status = 500
        return { error: "Failed to create lesson", status: false }
    }
}

export const updateLesson = async (ctx: Context<{ body: UpdateLessonInput, params: { lessonId: string } }>) => {
    const { body, params, set } = ctx;
    const { lessonId } = params;
    const { courseId, chapterId, lessonName, order, videoUrl, duration } = body

    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const payload = {
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonName,
            order,
            videoUrl,
            duration: Number(duration),
            isActive: true
        }

        set.status = 200
        const lesson = await lessonsCollection.updateOne({ _id: new ObjectId(lessonId) }, { $set: payload });
        return {
            message: "Lesson updated successfully",
            lessonId: lesson,
        }

    } catch (error) {
        console.log(error)
        set.status = 500
        return { error: "Failed to update lesson", status: false }
    }
}

export const getAllLessonsByChapterId = async (ctx: Context<{ params: { chapterId: string } }>) => {
    const { params, set } = ctx;
    const { chapterId } = params;
    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const lessons = await lessonsCollection.find({ chapterId: new ObjectId(chapterId), isDeleted: false, isActive: true }).sort({ order: 1 }).toArray();
        set.status = 200;
        return {
            lessons,
            message: "Lessons fetched successfully"
        }
    } catch (error) {
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

export const deleteLesson = async (ctx: Context<{ params: { lessonId: string } }>) => {
    const { params, set } = ctx;
    const { lessonId } = params;
    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const result = await lessonsCollection.updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: { isDeleted: true } }
        )
        if (result.modifiedCount === 0) {
            set.status = 500;
            return { error: "Failed to delete lesson" };
        }
        return {
            message: "Lesson deleted successfully"
        }
    } catch (error) {
        console.log(error)
        return {
            error: "Failed to delete lesson",
            status: false
        }
    }
}