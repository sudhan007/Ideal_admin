import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";

export const LESSONS_COLLECTION = "lessons";


const lessonsModel = t.Object({
    courseId: t.String(),
    chapterId: t.String(),
    lessonName: t.String(),
    videoUrl: t.String(),
    order: t.Number({ default: 0 }),
    duration: t.Number({ default: 0 }),
    isActive: t.Optional(t.Boolean({ default: true })),
    ...baseFields.properties
})

export const createLessonSchema = {
    body: lessonsModel,
    detail: {
        description: "Create a new lesson",
        tags: ["Lessons"],
        summary: "Create Lesson"
    }
}

export const updateLessonSchema = {
    body: t.Partial(lessonsModel),
    detail: {
        description: "Update an existing lesson",
        tags: ["Lessons"],
        summary: "Update Lesson"
    }
}

export const deleteLessonByIdSchema = {
    detail: {
        description: "Delete a lesson",
        tags: ["Lessons"],
        summary: "Delete Lesson"
    }
}

export const getLessonsByChapterSchema = {
    detail: {
        description: "Get all lessons",
        tags: ["Lessons"],
        summary: "Get Lessons"
    }
}

export const toggleLessonStatusSchema = {
    detail: {
        description: "Toggle lesson active status",
        tags: ["Lessons"],
        summary: "Toggle Lesson Status"
    }
}


export type CreateLessonInput = typeof createLessonSchema.body.static;
export type UpdateLessonInput = typeof updateLessonSchema.body.static;

