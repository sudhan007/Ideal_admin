import { baseFields } from "@lib/models/base-model.config";
import { t } from "elysia";

const TaskBase = t.Object({
    courseId: t.String(),
    chapterId: t.String(),
    lessonId: t.String(),
    taskName: t.String(),
    taskDescription: t.String(),
    dueDateTime: t.String({}),
    fileType: t.Union([t.Literal("PDF"), t.Literal("IMAGE")]),
    isActive: t.Optional(t.Boolean({ default: true })),
    ...baseFields.properties

});

const taskCreateModel = t.Object({
    ...TaskBase.properties,
    taskImage: t.Optional(
        t.Union([
            t.File({ type: "image/*" }),
            t.Array(t.File({ type: "image/*" }))
        ])
    ),
    taskPdf: t.Optional(
        t.File({ type: "application/pdf" })
    ),
});

export const createTaskDto = {
    body: taskCreateModel,
    detail: {
        description: "Create a new task with either a PDF or multiple images",
        summary: "Create Task"
    }
};

export const getTasksDto = {
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
        summary: "Get tasks ",
        description: "Fetches tasks with filters and pagination",
    }
}


export const SubmitTaskDto = {
    body: t.Object({
        taskId: t.String({
            description: "Task ID to submit"
        }),
        submissionType: t.Union([
            t.Literal("IMAGES"),
            t.Literal("PDF"),
            t.Literal("GOOGLE_DRIVE_LINK")
        ]),
        images: t.Optional(
            t.Union([
                t.File({ type: "image/*" }),
                t.Array(t.File({ type: "image/*" }))
            ])
        ),
        pdf: t.Optional(
            t.Union([
                t.File({ type: "application/pdf" }),
                t.Array(t.File({ type: "application/pdf" }))
            ])
        ),
        googleDriveLink: t.Optional(t.String()),
        notes: t.Optional(t.String())
    }),
    detail: {
        summary: "Submit task answer",
        description: "Student submits task answer via images, PDF, or Google Drive link",
    }
};
export const ReviewTaskDto = {
    body: t.Object({
        submissionId: t.String({
            description: "Task submission ID"
        }),
        status: t.Union([
            t.Literal("COMPLETED"),
            t.Literal("REJECTED")
        ], {
            description: "Review status: COMPLETED or REJECTED"
        }),
        feedback: t.Optional(t.String({
            description: "Admin feedback (required if rejected)"
        })),
        rejectedItems: t.Optional(t.Array(t.Object({
            type: t.String({ description: "Type: image, pdf, or link" }),
            index: t.Optional(t.Number({ description: "Index for images" })),
            reason: t.String({ description: "Reason for rejection" })
        })))
    }),
    detail: {
        summary: "Review task submission",
        description: "Admin reviews and marks task as completed or rejected with feedback",
    }
};


// Get Submissions DTO
export const GetSubmissionsDto = {
    query: t.Object({
        taskId: t.Optional(t.String()),
        studentId: t.Optional(t.String()),
        status: t.Optional(t.Union([
            t.Literal("SUBMITTED"),
            t.Literal("RE_SUBMITTED"),
            t.Literal("REJECTED"),
            t.Literal("COMPLETED")
        ])),
        page: t.Optional(t.String({ default: "1" })),
        limit: t.Optional(t.String({ default: "10" })),
    }),
    detail: {
        summary: "Get task submissions",
        description: "Get task submissions with filters",
    }
};

// Get Submission History DTO
export const GetSubmissionHistoryDto = {
    query: t.Object({
        submissionId: t.String({
            description: "Main submission ID"
        }),
        page: t.Optional(t.String({ default: "1" })),
        limit: t.Optional(t.String({ default: "10" })),
    }),
    detail: {
        summary: "Get submission history",
        description: "Get all submission attempts for a specific task submission",
    }
};


export type TaskCreateSchema = typeof createTaskDto.body.static;
export type TaskGetSchema = typeof getTasksDto.query.static
export type TaskSubmitSchema = typeof SubmitTaskDto.body.static
export type TaskReviewSchema = typeof ReviewTaskDto.body.static
export type GetSubmissionsSchema = typeof GetSubmissionsDto.query.static;
export type GetSubmissionHistorySchema = typeof GetSubmissionHistoryDto.query.static;