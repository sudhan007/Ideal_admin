import { Elysia } from "elysia";
import { createCourse, deleteCourseById, getAllCourseNames, getAllCourses, getCourseById, toggeleCourseStatusById, updateCourse } from "./course.service";
import { courseCreateSchema, courseDeleteSchema, courseNamesQuerySchema, courseStatusToggleSchema, courseUpdateSchema, getCourseByIdSchema, getCoursesSchema } from "./course.model";

export const courseController = new Elysia({
    prefix: '/courses'
})
    .post('/', createCourse, courseCreateSchema)
    .put('/:courseId', updateCourse, courseUpdateSchema)
    .get('/', getAllCourses, getCoursesSchema)
    .get('/:courseId', getCourseById, getCourseByIdSchema)
    .get('/names', getAllCourseNames, courseNamesQuerySchema)
    .patch('/:courseId', toggeleCourseStatusById, courseStatusToggleSchema)
    .delete('/:courseId', deleteCourseById, courseDeleteSchema);