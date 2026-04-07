import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";
import { Difficulty, OptionsFormat, OptionType, QuestionModel, QuestionType, SolutionType } from "@types";

const demoCourseBase = t.Object({
    courseId: t.String({ default: "courseId" }),
    videoUrl: t.String(),
    isActive: t.Boolean({ default: true }),
    ...baseFields.properties
});
export const createDemoCourseDto = {
    body: demoCourseBase,
    detail: {
        description: "Create a new Demo Course",
        summary: "Create Demo Course"
    }
}

export const updateDemoCourseDto = {
    body: t.Object({
        videoUrl: t.Optional(t.String()),
        courseId: t.Optional(t.String()),
    }),
    params: t.Object({
        id: t.String(),
    }),
    detail: {
        description: "Update an existing Batch",
        summary: "Update Batch",
    },
};

export const addQuestionToDemoCourseDto = {
    body: t.Object({
        demoCourseId: t.String(),
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
            t.String()
        ]),
        questionImage: t.Optional(t.File()),
        questionModel: t.Enum(QuestionModel),
        options: t.Union([t.String(), t.Array(t.Any())]),
        optionImage_0: t.Optional(t.File()),
        optionImage_1: t.Optional(t.File()),
        optionImage_2: t.Optional(t.File()),
        optionImage_3: t.Optional(t.File()),
        correctAnswer: t.String(),
        isActive: t.Optional(t.Boolean({ default: true })),
        ...baseFields.properties
    }),
    detail: {
        description: "Add Question to Exam ",
        summary: "Add Question to Exam"
    }
}
export const getDemoQuizQuestionsDto = {
    query: t.Object({
        demoCourseId: t.String({
            description: "Demo Course ID"
        }),
        questionModel: t.Optional(t.Union([
            t.Literal("PRE"),
            t.Literal("POST")
        ])),
        difficulty: t.Optional(t.Union([
            t.Literal("EASY"),
            t.Literal("MEDIUM"),
            t.Literal("HARD")
        ], {
            description: "Difficulty level (optional)"
        })),
        type: t.Optional(t.Union([
            t.Literal("MCQ"),
            t.Literal("FILL_BLANK")
        ], {
            description: "Question type (optional)"
        })),
        search: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
    }),
    detail: {
        summary: "Get quiz questions with filters and shuffling",
        description: "Fetches quiz questions without answers, shuffles questions and MCQ options"
    }
}
export const submitDemoQuizAnswersDto = {
    body: t.Object({
        demoCourseId: t.String(),
        quizType: t.String(),
        answers: t.Array(
            t.Object({
                questionId: t.String(),
                answer: t.String(),
                isMarkedForReview: t.Boolean({ default: false })
            })
        )
    }),
    detail: {
        summary: "Submit quiz answers",
        description: "Submits quiz answers and returns results"
    }
}
export const getDemoQuestionsByIdDto = {
    params: t.Object({
        questionId: t.String({
            description: "Question ID"
        })
    }),
    detail: {
        summary: "Get quiz questions with filters and shuffling",
        description: "Fetches quiz questions without answers, shuffles questions and MCQ options"
    }
}
export const demoCourseGetQueryDto = {
    query: t.Object({
        page: t.Optional(t.String({ default: "1", pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ default: "10", pattern: "^[0-9]+$" })),
    })
}
export const demoquestionUpdateDto = t.Partial(
    t.Object({
        examId: t.String(),
        difficulty: t.Enum(Difficulty),
        type: t.Enum(QuestionType),
        solutionType: t.Optional(t.Enum(SolutionType)),
        solution: t.Optional(t.Union([t.String(), t.File()])),
        question: t.Optional(t.Union([
            t.Object({
                text: t.Optional(t.String()),
                latex: t.Optional(t.String()),
                image: t.Optional(t.String())

            }),
            t.String()
        ])),
        questionImage: t.Optional(t.File()),
        options: t.Union([t.String(), t.Array(t.Any())]),
        optionImage_0: t.Optional(t.File()),
        optionImage_1: t.Optional(t.File()),
        optionImage_2: t.Optional(t.File()),
        optionImage_3: t.Optional(t.File()),
        correctAnswer: t.String(),
    })
);
export const demoDeleteQuestionDto = {
    query: t.Object({
        questionId: t.String({
            description: "Course ID"
        }),
    }),
    detail: {
        summary: "Delete Question",
        description: "Delete Question"
    }
}
export type CreateDemoCourseSchema = typeof createDemoCourseDto.body.static;
export type AddQuestionToDemoCourseSchema = typeof addQuestionToDemoCourseDto.body.static
export type GetDemoQuizQuestionsSchema = typeof getDemoQuizQuestionsDto.query.static;
export type SubmitDemoQuizAnswersSchema = typeof submitDemoQuizAnswersDto.body.static
export type GetDemoQuestionsById = typeof getDemoQuestionsByIdDto.params.static;
export type UpdateDemoCourseSchema = typeof updateDemoCourseDto.body.static
export type DemoGetQuerySchema = typeof demoCourseGetQueryDto.query.static
export type DemoQuestionUpdate = typeof demoquestionUpdateDto.body.static
export type DemoDeleteQuestionSchema = typeof demoDeleteQuestionDto.query.static;
