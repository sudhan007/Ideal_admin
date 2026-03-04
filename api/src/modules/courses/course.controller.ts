import { Elysia } from "elysia";
import { createCourse, deleteCourseById, getAllCourseNames, getAllCourses, getCourseById, toggeleCourseStatusById, toggleTrendingCourse, updateCourse } from "./course.service";
import { courseCreateSchema, courseDeleteSchema, courseNamesQuerySchema, courseStatusToggleSchema, courseUpdateSchema, getCourseByIdSchema, getCoursesSchema, toggleTrendingCourseSchema } from "./course.model";
import { adminAndStudent, adminOnly } from "@lib/utils/roles-guard";

export const courseController = new Elysia({
    prefix: '/courses',
    detail: {
        tags: ["Courses"]
    }
})
    .post('/', createCourse, { ...courseCreateSchema, beforeHandle: adminOnly })
    .put('/:courseId', updateCourse, { ...courseUpdateSchema, beforeHandle: adminOnly })
    .get('/', getAllCourses, { ...getCoursesSchema, beforeHandle: adminAndStudent })
    .get('/:courseId', getCourseById, { ...getCourseByIdSchema, beforeHandle: adminAndStudent })
    .get('/names', getAllCourseNames, { ...courseNamesQuerySchema, beforeHandle: adminOnly })
    .patch('/toggle-status/:courseId', toggeleCourseStatusById, { ...courseStatusToggleSchema, beforeHandle: adminOnly })
    .delete('/:courseId', deleteCourseById, { ...courseDeleteSchema, beforeHandle: adminOnly })
    .patch('/trending/:courseId', toggleTrendingCourse, { ...toggleTrendingCourseSchema, beforeHandle: adminOnly })
