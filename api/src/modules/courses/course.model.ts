import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";

const courseBase = t.Object({
    courseName: t.String({ default: "10th Grade Math CBSE" }),
    mentor: t.String({ default: "mentorId" }),
    strikePrice: t.String(),
    actualPrice: t.String(),
    board: t.String({ default: "boardId" }),
    grade: t.String({ default: "gradeId" }),
    courseDurationMinutes: t.String({ default: "0" }),
    isActive: t.Boolean({ default: true }),
    isTrending: t.Boolean({ default: false }),
    ...baseFields.properties
});


const courseCreateModel = t.Object({
    bannerImage: t.File({
        type: "image/*",
    }),
    ...courseBase.properties,
});

const courseUpdateModel = t.Object({
    ...courseBase.properties,
    bannerImage: t.Union([
        t.File({ type: "image/*" }),
        t.String({ description: "URL of the banner image" }),
    ], {
        description: "Either upload a new banner image or provide a URL"
    }),
}, {
    additionalProperties: false
});

export const courseCreateSchema = {
    body: courseCreateModel,
    consumes: ["multipart/form-data"],
    detail: {
        summary: "Create a new course",
        description: "Requires uploading a banner image",
    }
};

export const courseUpdateSchema = {
    body: courseUpdateModel,
    detail: {
        summary: "Update a course",
        description: "Partially update course details. bannerImage can be a new file or a URL.",
    }
};

export const getCoursesSchema = {
    query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        board: t.Optional(t.String()),
        grade: t.Optional(t.String()),
        search: t.Optional(t.String()),
        sortBy: t.Optional(t.Union([t.Literal("courseName"), t.Literal("actualPrice"), t.Literal("createdAt")], { default: "createdAt" })),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")], { default: "asc" })),
        trending: t.Optional(t.String()),
    }),
    detail: {
        summary: "Get all courses",
        description: "Retrieve a list of all available courses",
    }
};

export const getCourseByIdSchema = {
    params: t.Object({
        courseId: t.String(),
    }),
    detail: {
        summary: "Get a specific course",
        description: "Retrieve details of a specific course",
    }
};

export const courseNamesQuerySchema = {
    query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        search: t.Optional(t.String()),
    }),
    detail: {
        summary: "Get course names",
        description: "Retrieve a list of course names matching the search criteria",
    }
}

export const courseStatusToggleSchema = {
    params: t.Object({
        courseId: t.String(),
    }),
    detail: {
        summary: "Toggle course active status",
        description: "Activate or deactivate a course by its ID",
    }
};

export const courseDeleteSchema = {
    params: t.Object({
        courseId: t.String(),
    }),
    detail: {
        summary: "Delete a course",
        description: "Soft delete a course by its ID",
    }
};

export const toggleTrendingCourseSchema = {
    params: t.Object({
        courseId: t.String(),
    }),
    detail: {
        summary: "Toggle course trending status",
        description: "Toggle the trending status of a course by its ID",
    }
};

export type CourseCreateInput = typeof courseCreateSchema.body.static;
export type CourseUpdateInput = typeof courseUpdateSchema.body.static;
export type GetCoursesInput = typeof getCoursesSchema.query.static;
export type CourseNamesQuery = typeof courseNamesQuerySchema.query.static;