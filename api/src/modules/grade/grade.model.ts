import { baseFields } from "@lib/models/base-model.config";
import { t } from "elysia";

export const GRADE_COLLECTION = "grades";

const gradeBase = t.Object({
    grade: t.Union([
        t.Literal("I"), t.Literal("II"), t.Literal("III"), t.Literal("IV"),
        t.Literal("V"), t.Literal("VI"), t.Literal("VII"), t.Literal("VIII"),
        t.Literal("IX"), t.Literal("X"), t.Literal("XI"), t.Literal("XII"),
    ], { default: "X" }),
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
        search: t.Optional(t.String({ minLength: 1 })),
        page: t.Optional(t.Number({ minimum: 1, default: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
    }),
    detail: {
        description: "Get a Grade",
        summary: "Get Grade"
    }
}


export type CreateGradeSchema = typeof gradeCreateDto.body.static
export type UpdateGradeSchema = typeof gradeUpdateDto.body.static
export type GetGradeSchema = typeof getGradeDto.query.static