import { baseFields } from "@lib/models/base-model.config";
import { Difficulty, OptionsFormat, OptionType, QuestionType, SolutionType } from "@types";
import { t } from "elysia";

const ExamBase = t.Object({
    courseId: t.String(),
    chapterId: t.String(),
    lessonId: t.String(),
    examName: t.String(),
    dueDateTime: t.String({}),
    isActive: t.Optional(t.Boolean({ default: true })),
    ...baseFields.properties
});

export const createExamDto = {
    body: ExamBase,
    detail: {
        description: "Create a new exam ",
        summary: "Create Exam"
    }
};

export const getExamDto = {
    query: t.Object({
        courseId: t.Optional(t.String({
            description: "Course ID (optional)"
        })),
        chapterId: t.Optional(t.String({
            description: "Chapter ID (optional)"
        })),
        lessonId: t.Optional(t.String({
            description: "Lesson ID (optional)"
        })),
        search: t.Optional(t.String()),
        page: t.Optional(t.String({ default: "1" })),
        limit: t.Optional(t.String({ default: "10" })),
    }),
    detail: {
        summary: "Get exams ",
        description: "Fetches exams with filters and pagination",
    }
}

export const getExamByCourseDto = {
    query: t.Object({
        courseId: t.Optional(t.String({
            description: "Course ID (optional)"
        })),
        chapterId: t.Optional(t.String({
            description: "Chapter ID (optional)"
        })),
        lessonId: t.Optional(t.String({
            description: "Lesson ID (optional)"
        })),
        search: t.Optional(t.String()),
    }),
    detail: {
        summary: "Get exams By Course",
        description: "Fetches exams with filters and pagination",
    }
}

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
        options: t.Union([t.String(), t.Array(t.Any())]),
        optionImage_0: t.Optional(t.File()),
        optionImage_1: t.Optional(t.File()),
        optionImage_2: t.Optional(t.File()),
        optionImage_3: t.Optional(t.File()),
        questionImage: t.Optional(t.File()),
        correctAnswer: t.String(),
        isActive: t.Optional(t.Boolean({ default: true })),
        ...baseFields.properties
    }),
    detail: {
        description: "Add Question to Exam ",
        summary: "Add Question to Exam"
    }
}

export const examquestionUpdateDto = t.Partial(
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
export const getExamQuizQuestionsDto = {
    query: t.Object({
        examId: t.String({
            description: "Course ID"
        }),
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

export const submitExamQuizAnswersDto = {
    body: t.Object({
        examId: t.String(),
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

        examId: t.String({
            description: "ExamId ID (optional)"
        }),
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

export const GetSubmissionsDto = {
    query: t.Object({
        examId: t.String(),
        studentId: t.Optional(t.String()),
        page: t.Optional(t.String({ default: "1" })),
        limit: t.Optional(t.String({ default: "10" })),
    }),
    detail: {
        summary: "Get task submissions",
        description: "Get task submissions with filters",
    }
};

export const studentExamReportsDto = {
    query: t.Object({
        examId: t.String(),
        studentId: t.Optional(t.String()),
        page: t.Optional(t.String({ default: "1" })),
        limit: t.Optional(t.String({ default: "10" })),
    }),
    detail: {
        summary: "Get task submissions",
        description: "Get task submissions with filters",
    }
};

export const deleteExamQuestionDto = {
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

export type ExamCreateSchema = typeof createExamDto.body.static;
export type ExamGetSchema = typeof getExamDto.query.static
export type GetExamsByCourseSchema = typeof getExamByCourseDto.query.static
export type AddQuestionToExamSchema = typeof addQuestionToExamDto.body.static
export type GetExamQuizQuestionsSchema = typeof getExamQuizQuestionsDto.query.static;
export type submitExamQuizAnswersSchema = typeof submitExamQuizAnswersDto.body.static
export type GetQuestionsById = typeof getQuestionsByIdDto.params.static;
export type GetAllExamQuestions = typeof getAllQuizQuestionsDto.query.static
export type GetSubmissionsSchema = typeof GetSubmissionsDto.query.static;
export type StudentSubmissionSchema = typeof studentExamReportsDto.query.static;
export type ExamQuestionUpdate = typeof examquestionUpdateDto.body.static
export type DeleteExamQuestionSchema = typeof deleteExamQuestionDto.query.static;
