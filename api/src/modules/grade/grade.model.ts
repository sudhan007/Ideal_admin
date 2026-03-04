import { baseFields } from "@lib/models/base-model.config";
import { t } from "elysia";


const gradeBase = t.Object({
    // grade: t.Union([
    //     t.Literal("I"), t.Literal("II"), t.Literal("III"), t.Literal("IV"),
    //     t.Literal("V"), t.Literal("VI"), t.Literal("VII"), t.Literal("VIII"),
    //     t.Literal("IX"), t.Literal("X"), t.Literal("XI"), t.Literal("XII"),
    // ], { default: "X" }),
    grade: t.String(),
    isActive: t.Boolean({ default: true }),
    ...baseFields.properties,
});

export const gradeCreateDto = {
    body: t.Object({
        ...gradeBase.properties,
    }),
    detail: {
        description: "Create a new Grade",
        summary: "Create Grade"
    }
}

export const gradeUpdateDto = {
    body: t.Partial(gradeBase),
    params: t.Object({
        gradeId: t.String(),
    }),
    detail: {
        description: "Update an existing Grade",
        summary: "Update Grade"
    }
}


export const getGradeDto = {
    query: t.Object({
        search: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
    }),
    detail: {
        description: "Get a Grade",
        summary: "Get Grade"
    }
}

export const GradeDeleteSchemaDto = {
    params: t.Object({
        gradeId: t.String(),
    }),
    detail: {
        summary: "Delete a Grade",
        description: "Soft delete a Grade by its ID",
    }
};



export type CreateGradeSchema = typeof gradeCreateDto.body.static
export type UpdateGradeSchema = typeof gradeUpdateDto.body.static
export type GetGradeSchema = typeof getGradeDto.query.static
export type GradeDeleteSchema = typeof GradeDeleteSchemaDto.params.static