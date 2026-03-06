import { t } from "elysia";

export const getForeCastDetilsDto = {
    params: t.Object({
        courseId: t.String(),
    }),
    detail: {
        summary: "Get Course Forecast",
        description: "Schema for getting a course forecast",
    },
}
export const updateForeCastDto = {
    params: t.Object({
        courseId: t.String(),
    }),
    body: t.Object({
        daysPerWeek: t.Number({ minimum: 1, maximum: 7 }),
        minutesPerDay: t.Number({ minimum: 1 }),
        expectedCompletionDate: t.String(),

    }),
    detail: {
        summary: "Update Course Forecast",
        description: "Schema for updating a course forecast",
    },
};

export type CourseForecastSchema = typeof getForeCastDetilsDto.params.static;
export type UpdateForecastSchema = typeof updateForeCastDto.params.static & typeof updateForeCastDto.body.static;

