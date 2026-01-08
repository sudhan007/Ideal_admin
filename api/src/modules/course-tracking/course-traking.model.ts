import { t } from "elysia";

export const updateLessonProgressDto = {
    body: t.Object({
        enrollmentId: t.String(),
        lessonId: t.String(),
        videoProgress: t.Optional(
            t.Object({
                watchedDuration: t.Number(),
                totalDuration: t.Number(),
                lastWatchedPosition: t.Number(),
            })
        ),
        quizProgress: t.Optional(
            t.Object({
                passed: t.Boolean(),
                score: t.Number(),
                totalQuestions: t.Number(),
                correctAnswers: t.Number(),
            })
        ),
    }),
    detail: {
        summary: "Update lesson progress",
        description: "Schema for updating student's lesson progress",
    },
};

export type UpdateLessonProgressSchema = typeof updateLessonProgressDto.body.static;