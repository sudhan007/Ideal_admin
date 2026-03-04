import { Elysia } from "elysia";
import { createLesson, deleteLesson, getAllLessonsByChapterId, getAllLessonsDropdown, toggleLessonsStatusById, updateLesson } from "./lessons.service";
import { createLessonSchema, deleteLessonByIdSchema, getLessonsByChapterSchema, toggleLessonStatusSchema, updateLessonSchema } from "./lessons.model";
import { adminAndStudent } from "@lib/utils/roles-guard";

export const lessonsController = new Elysia({
    prefix: '/lessons',
    tags: ['Lessons']
})
    .post('/', createLesson, createLessonSchema)
    .get('/:chapterId', getAllLessonsByChapterId, { ...getLessonsByChapterSchema, beforeHandle: adminAndStudent })
    .put('/:lessonId', updateLesson, updateLessonSchema)
    .delete('/:lessonId', deleteLesson, toggleLessonStatusSchema)
    .patch('/:lessonId', toggleLessonsStatusById, deleteLessonByIdSchema)
    .get('/dropdown/:chapterId', getAllLessonsDropdown, { ...getLessonsByChapterSchema, beforeHandle: adminAndStudent })
