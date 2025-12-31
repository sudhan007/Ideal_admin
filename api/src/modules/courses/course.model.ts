import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";

export const COURSE_COLLECTION = "courses";


const courseBase = t.Object({
    courseName: t.String({ default: "10th Grade Math CBSE" }),
    mentor: t.String({ default: "mentorId" }),
    strikePrice: t.String({ default: "0", pattern: "^[0-9]+(\\.[0-9]{1,2})?$" }),
    actualPrice: t.String({ default: "0", pattern: "^[0-9]+(\\.[0-9]{1,2})?$" }),
    board: t.Union([
        t.Literal("CBSE"),
        t.Literal("TN State Board"),
    ], { default: "CBSE" }),
    grade: t.Union([
        t.Literal("I"), t.Literal("II"), t.Literal("III"), t.Literal("IV"),
        t.Literal("V"), t.Literal("VI"), t.Literal("VII"), t.Literal("VIII"),
        t.Literal("IX"), t.Literal("X"), t.Literal("XI"), t.Literal("XII"),
    ], { default: "X" }),
    isActive: t.Boolean({ default: true }),
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
        t.String({ format: "uri", description: "URL of the banner image" }),
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
        tags: ["Courses"],
    }
};

export const courseUpdateSchema = {
    body: courseUpdateModel,
    detail: {
        summary: "Update a course",
        description: "Partially update course details. bannerImage can be a new file or a URL.",
        tags: ["Courses"],
    }
};

export const getCoursesSchema = {
    query: t.Object({
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        limit: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
        board: t.Optional(t.Union([t.Literal("CBSE"), t.Literal("TN State Board")], { default: "CBSE" })),
        grade: t.Union([
            t.Literal("I"), t.Literal("II"), t.Literal("III"), t.Literal("IV"),
            t.Literal("V"), t.Literal("VI"), t.Literal("VII"), t.Literal("VIII"),
            t.Literal("IX"), t.Literal("X"), t.Literal("XI"), t.Literal("XII"),
        ], { default: "X" }),
        search: t.Optional(t.String()),
        sortBy: t.Optional(t.Union([t.Literal("courseName"), t.Literal("actualPrice"), t.Literal("createdAt")], { default: "createdAt" })),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")], { default: "asc" })),
    }),
    detail: {
        summary: "Get all courses",
        description: "Retrieve a list of all available courses",
        tags: ["Courses"],
    }
};

export const getCourseByIdSchema = {
    detail: {
        summary: "Get a specific course",
        description: "Retrieve details of a specific course",
        tags: ["Courses"],
    }
};

export const courseNamesQuerySchema = {
    query: t.Object({
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        limit: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
    }),
    detail: {
        summary: "Get course names",
        description: "Retrieve a list of course names matching the search criteria",
        tags: ["Courses"],
    }
}

export const courseStatusToggleSchema = {
    detail: {
        summary: "Toggle course active status",
        description: "Activate or deactivate a course by its ID",
        tags: ["Courses"],
    }
};

export const courseDeleteSchema = {
    detail: {
        summary: "Delete a course",
        description: "Soft delete a course by its ID",
        tags: ["Courses"],
    }
};

export type CourseCreateInput = typeof courseCreateSchema.body.static;
export type CourseUpdateInput = typeof courseUpdateSchema.body.static;
export type GetCoursesInput = typeof getCoursesSchema.query.static;
export type CourseNamesQuery = typeof courseNamesQuerySchema.query.static;