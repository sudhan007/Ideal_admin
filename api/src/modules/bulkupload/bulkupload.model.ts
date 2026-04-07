import { baseFields } from "@lib/models/base-model.config";
import { Difficulty, QuestionType, QuestionModel, SolutionType, OptionType, OptionsFormat } from "@types";
import { t } from "elysia";

export const questionBase = t.Object({
    courseId: t.String(),
    chapterId: t.String(),
    lessonId: t.String(),
    type: t.Enum(QuestionType),
    difficulty: t.Enum(Difficulty),
    questionModel: t.Enum(QuestionModel),
    questionSet: t.String(),
    solutionType: t.Enum(SolutionType),
    solution: t.Union([t.String(), t.File()]),
    question: t.Union([
        t.Object({
            text: t.Optional(t.String()),
            latex: t.Optional(t.String()),
            image: t.Optional(t.String())
        }),
        t.String()
    ]),
    questionImage: t.Optional(t.File()),
    options: t.Optional(t.Union([
        t.Array(
            t.Object({
                id: t.Enum(OptionType),
                answer: t.String(),
                type: t.Enum(OptionsFormat)
            })
        ),
        t.String()
    ])),
    correctAnswer: t.String(),
    isActive: t.Optional(t.Boolean({ default: true })),
    ...baseFields.properties
})

export const addQuestionToExamDto = {
    body: t.Object({
        examId: t.String(),
        type: t.Enum(QuestionType),
        difficulty: t.Enum(Difficulty),
        solutionType: t.Enum(SolutionType),
        solution: t.Union([t.String(), t.File()]),
        question: t.Union([
            t.Object({
                text: t.Optional(t.String()),
                latex: t.Optional(t.String()),
                image: t.Optional(t.String())

            }),
            t.String()   // JSON-stringified when sent via FormData
        ]),
        options: t.Optional(t.Union([
            t.Array(
                t.Object({
                    id: t.Enum(OptionType),
                    answer: t.String(),
                    type: t.Enum(OptionsFormat)
                })
            ),
            t.String()   // JSON-stringified when sent via FormData
        ])),
        questionImage: t.Optional(t.File()),
        correctAnswer: t.String(),
        isActive: t.Optional(t.Boolean({ default: true })),
        ...baseFields.properties
    }),

}


export const createQuestionDto = {
    body: questionBase,
    detail: {
        description: "Create a new Question",
        summary: "Create Question"
    }
}

export type CreateQuestionSchema = typeof createQuestionDto.body.static;
export type AddQuestionToExamSchema = typeof addQuestionToExamDto.body.static
