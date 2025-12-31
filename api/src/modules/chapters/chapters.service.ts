import { type Context } from "elysia";
import { CHAPTERS_COLLECTION, CreateChapterInput, UpdateChapterInput } from "./chapters.model";
import { getCollection } from "@lib/config/db.config";
import { COURSE_COLLECTION } from "../courses/course.model";
import { ObjectId } from "mongodb";


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

export const getAllChaptersByCourseId = async (ctx: Context<{ params: { courseId: string } }>) => {
    const { params, set } = ctx;
    const { courseId } = params;
    try {
        const chapterCollection = await getCollection(CHAPTERS_COLLECTION);
        const chapters = await chapterCollection.find({ courseId: new ObjectId(courseId), isDeleted: false }).sort({ order: 1 }).toArray();
        set.status = 200;
        return {
            chapters,
        }
    } catch (error) {
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
