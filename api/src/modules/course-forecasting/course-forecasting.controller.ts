import { Elysia } from "elysia";
import { getAllForecasting, getForeCastDetails, updateForeCast } from "./course-forecasting.service";
import { studentOnly } from "@lib/utils/roles-guard";
import { getForeCastDetilsDto, updateForeCastDto } from "./course-forecasting.model";

export const courseForeCastController = new Elysia({
    prefix: '/course-forecast',
    detail: {
        tags: ["Course Forecast"]
    }
})

    .get("/:courseId", getForeCastDetails, { ...getForeCastDetilsDto, beforeHandle: studentOnly })
    .patch("/:courseId", updateForeCast, { ...updateForeCastDto, beforeHandle: studentOnly })
    .get("/student/:studentId", getAllForecasting)


