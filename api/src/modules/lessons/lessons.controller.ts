import { Elysia } from "elysia";
import { createLesson, deleteLesson, getAllLessonsByChapterId, toggleLessonsStatusById, updateLesson } from "./lessons.service";
import { createLessonSchema, deleteLessonByIdSchema, getLessonsByChapterSchema, toggleLessonStatusSchema, updateLessonSchema } from "./lessons.model";

export const lessonsController = new Elysia({
    prefix: '/lessons',
    tags: ['Lessons']
})
.post('/', createLesson, createLessonSchema)
.get('/:chapterId', getAllLessonsByChapterId, getLessonsByChapterSchema)
.put('/:lessonId', updateLesson, updateLessonSchema)
.delete('/:lessonId', deleteLesson, toggleLessonStatusSchema)
.patch('/:lessonId', toggleLessonsStatusById, deleteLessonByIdSchema)