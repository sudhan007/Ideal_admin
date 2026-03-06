import { t } from "elysia";

export const updateVideoProgressDto = {
    body: t.Object({
        enrollmentId: t.String(),
        lessonId: t.String(),
        watchedSeconds: t.Number(),
    }),
    detail: {
        summary: "Update lesson progress",
        description: "Schema for updating student's lesson progress",
    },
};

export type UpdateVideoProgressSchema = typeof updateVideoProgressDto.body.static;