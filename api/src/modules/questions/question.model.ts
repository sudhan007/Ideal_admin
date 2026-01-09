import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";
import { QuestionType, Difficulty, OptionType } from "@types";

export const QUESTIONS_COLLECTION = "questions"

export const questionBase = t.Object({
    courseId: t.String(),
    chapterId: t.String(),
    lessonId: t.String(),
    type: t.Enum(QuestionType),
    difficulty: t.Enum(Difficulty),
    marks: t.Number({ default: 1 }),
    question: t.Object({
        text: t.Optional(t.String()),
        latex: t.Optional(t.String())
    }),
    options: t.Optional(
        t.Array(
            t.Object({
                id: t.Enum(OptionType),
                answer: t.String()
            })
        )
    ),
    correctAnswer: t.String(),
    isActive: t.Optional(t.Boolean({ default: true })),
    ...baseFields.properties
});

export const createQuestionDto = {
    body: questionBase,
    detail: {
        description: "Create a new Question",
        summary: "Create Question"
    }
}

export type CreateQuestionSchema = typeof createQuestionDto.body.static;
