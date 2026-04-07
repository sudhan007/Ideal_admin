import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";
import { QuestionType, Difficulty, OptionType, OptionsFormat, QuestionModel, SolutionType } from "@types";


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
    options: t.Union([t.String(), t.Array(t.Any())]),
    optionImage_0: t.Optional(t.File()),
    optionImage_1: t.Optional(t.File()),
    optionImage_2: t.Optional(t.File()),
    optionImage_3: t.Optional(t.File()),
    correctAnswer: t.String(),
    isActive: t.Optional(t.Boolean({ default: true })),
    ...baseFields.properties
})

export const createQuestionDto = {
    body: questionBase,
    detail: {
        description: "Create a new Question",
        summary: "Create Question"
    }
}

export const questionUpdate = t.Partial(
    t.Object({
        courseId: t.String(),
        chapterId: t.String(),
        lessonId: t.String(),
        difficulty: t.Enum(Difficulty),
        type: t.Enum(QuestionType),
        solutionType: t.Optional(t.Enum(SolutionType)),
        solution: t.Optional(t.Union([t.String(), t.File()])),
        question: t.Optional(t.Union([
            t.Object({
                text: t.Optional(t.String()),
                latex: t.Optional(t.String()),
                // image here will be the S3 URL string after upload (not a File)
                image: t.Optional(t.String())
            }),
            t.String()
        ])),
        // ✅ Top-level field — this is where the raw File arrives from FormData
        questionImage: t.Optional(t.File()),
        options: t.Union([t.String(), t.Array(t.Any())]),
        optionImage_0: t.Optional(t.File()),
        optionImage_1: t.Optional(t.File()),
        optionImage_2: t.Optional(t.File()),
        optionImage_3: t.Optional(t.File()),
        correctAnswer: t.String(),
    })
)

export const updateQuestionDto = {
    body: questionUpdate,
    params: t.Object({
        questionId: t.String()
    }),
    detail: {
        description: "Update an existing question (partial update)",
        summary: "Update Question"
    }
}
export const getQuizQuestionsDto = {
    query: t.Object({
        courseId: t.String({
            description: "Course ID"
        }),
        chapterId: t.Optional(t.String({
            description: "Chapter ID (optional)"
        })),
        lessonId: t.Optional(t.String({
            description: "Lesson ID (optional)"
        })),
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
export const submitQuizAnswersDto = {
    body: t.Object({
        enrollmentId: t.String(),
        lessonId: t.String(),
        quizType: t.String(),
        questionSetId: t.Optional(t.String()),
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
export const getAllQuizQuestionsDto = {
    query: t.Object({
        courseId: t.String({
            description: "Course ID"
        }),
        chapterId: t.Optional(t.String({
            description: "Chapter ID (optional)"
        })),
        lessonId: t.Optional(t.String({
            description: "Lesson ID (optional)"
        })),
        difficulty: t.Optional(t.Union([
            t.Literal("EASY"),
            t.Literal("MEDIUM"),
            t.Literal("HARD")
        ], {
            description: "Difficulty level (optional)"
        })),
        questionModel: t.Optional(t.Union([
            t.Literal("PRE"),
            t.Literal("POST")
        ])),
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
export const getQuestionsByIdDto = {
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

export const deleteQuestionDto = {
    query: t.Object({
        questionId: t.String({
            description: "question ID"
        }),
    }),
    detail: {
        summary: "Delete Question",
        description: "Delete Question"
    }
}
export type CreateQuestionSchema = typeof createQuestionDto.body.static;
export type GetQuizQuestionsSchema = typeof getQuizQuestionsDto.query.static;
export type UpdateQuizSchema = typeof updateQuestionDto.body.static
export type GetAllQuizQuestionsSchema = typeof getAllQuizQuestionsDto.query.static;
export type GetQuestionsById = typeof getQuestionsByIdDto.params.static;
export type SubmitQuizSchema = typeof submitQuizAnswersDto.body.static;
export type DeleteQuestionSchema = typeof deleteQuestionDto.query.static;