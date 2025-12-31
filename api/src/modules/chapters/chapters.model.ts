import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";

export const CHAPTERS_COLLECTION = "chapters";


const chapterModel = t.Object({
    courseId: t.String(),
    chapterName: t.String(),
    chapterDescription: t.Optional(t.String()),
    order: t.Number({ default: 0 }),
    isActive: t.Optional(t.Boolean({ default: true })),
    ...baseFields.properties
})

export const createChapterSchema = {
    body: chapterModel,
    detail: {
        description: "Create a new chapter",
        tags: ["Chapters"],
        summary: "Create Chapter"
    }
}

export const updateChapterSchema = {
    body: t.Partial(chapterModel),
    detail: {
        description: "Update an existing chapter",
        tags: ["Chapters"],
        summary: "Update Chapter"
    }
}

export const deleteChapterSchema = {
    detail: {
        description: "Delete a chapter",
        tags: ["Chapters"],
        summary: "Delete Chapter"
    }
}

export const getChaptersByCourseSchema = {
    detail: {
        description: "Get a chapter by ID",
        tags: ["Chapters"],
        summary: "Get Chapter"
    }
}

export const toggleChapterStatusSchema = {
    detail: {
        description: "Toggle chapter status",
        tags: ["Chapters"],
        summary: "Toggle Chapter Status"
    }
}

export const deleteChapterByIdSchema = {
    detail: {
        description: "Delete a chapter",
        tags: ["Chapters"],
        summary: "Delete Chapter"
    }
}

export type CreateChapterInput = typeof createChapterSchema.body.static;
export type UpdateChapterInput = typeof updateChapterSchema.body.static;

