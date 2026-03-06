import { t } from "elysia";

export const moveQuestionToExamsDto = {
    body: t.Object({
        examIds: t.Array(t.String()),
        questionIds: t.Array(t.String()),
    }),
    detail: {
        description: "Move Question to Exams ",
        summary: "Move Question to Exams"
    }
}

export type moveQuestionToExamsSchema = typeof moveQuestionToExamsDto.body.static 