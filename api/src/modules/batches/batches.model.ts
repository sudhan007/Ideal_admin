import { baseFields } from "@lib/models/base-model.config";
import { t } from "elysia";

const batchBase = t.Object({
    courseId: t.String(),
    batchName: t.String(),
    batchCode: t.String(),
    startDate: t.String({ format: "date" }),
    endDate: t.String({ format: "date" }),
    // days: t.Array(t.Union([t.Literal("MONDAY"), t.Literal("TUESDAY"), t.Literal("WEDNESDAY"), t.Literal("THURSDAY"), t.Literal("FRIDAY"), t.Literal("SATURDAY"), t.Literal("SUNDAY")])),
    startTime: t.String(),
    endTime: t.String(),
    isActive: t.Boolean({ default: true }),
    ...baseFields.properties
});

export const batchCreateDto = {
    body: t.Object({
        ...batchBase.properties,
    }),
    detail: {
        description: "Create a new Batch",
        summary: "Create Batch"
    }
}

export const batchUpdateDto = {
    body: t.Object({
        batchName: t.Optional(t.String()),
        batchCode: t.Optional(t.String()),
        courseId: t.Optional(t.String()),
        startDate: t.Optional(t.String({ format: "date" })),
        endDate: t.Optional(t.String({ format: "date" })),
        // days: t.Optional(
        //     t.Array(
        //         t.Union([
        //             t.Literal("MONDAY"),
        //             t.Literal("TUESDAY"),
        //             t.Literal("WEDNESDAY"),
        //             t.Literal("THURSDAY"),
        //             t.Literal("FRIDAY"),
        //             t.Literal("SATURDAY"),
        //             t.Literal("SUNDAY"),
        //         ])
        //     )
        // ),
        startTime: t.Optional(t.String()),
        endTime: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
    }),
    params: t.Object({
        id: t.String(),
    }),
    detail: {
        description: "Update an existing Batch",
        summary: "Update Batch",
    },
};

export const batchGetQueryDto = {
    query: t.Object({
        page: t.Optional(t.String({ default: "1", pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ default: "10", pattern: "^[0-9]+$" })),
        search: t.Optional(t.String()),
        courseId: t.Optional(t.String()),
        isActive: t.Optional(t.String({ enum: ["true", "false"] })),
    })
}

export const registerStudentToBatchDto = {
    body: t.Object({
        batchId: t.String(),
        mobileNumber: t.Optional(t.String({ pattern: "^[0-9]{10}$" })),
        email: t.Optional(t.String({ format: "email" })),
        loginMethod: t.Union([t.Literal("MOBILE"), t.Literal("EMAIL")], { default: "MOBILE" }),
        studentName: t.String(),
        dateOfBirth: t.String({ format: "date" }),
        gender: t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other")]),
        studentPhoneNumber: t.String({ pattern: "^[0-9]{10}$" }),
        parentPhoneNumber: t.String({ pattern: "^[0-9]{10}$" }),
        parentPhoneNumber2: t.String({ pattern: "^[0-9]{10}$" }),
        parentName: t.String(),
        address: t.String(),
        studentProfile: t.File({ type: "image/*" }),
        grade: t.String({ default: "gradeId" }),
        nameOfTheBoard: t.String({ default: "boardId" }),
        previousYearAnnualTotalMarks: t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" }),
        previousYearMathMarks: t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" }),
        referedBy: t.Optional(t.String()),
    }),
    detail: {
        description: "Register Student to Batch",
        summary: "Register Student to Batch",
    },
};
export const getBatchByIdSchema = {
    params: t.Object({
        batchId: t.String(),
    }),
    detail: {
        summary: "Get a specific Batch",
        description: "Retrieve details of a specific Batch",
    }
};


export type batchCreateSchema = typeof batchCreateDto.body.static;
export type BatchUpdateSchema = typeof batchUpdateDto.body.static;
export type BatchGetQuerySchema = typeof batchGetQueryDto.query.static;
export type RegisterStudentToBatchSchema = typeof registerStudentToBatchDto.body.static;