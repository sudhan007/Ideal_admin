import { Elysia } from "elysia";
import { createChapter, deleteChapterById, getAllChaptersByCourseId, toggelChapterStatusById, updateChapter } from "./chapters.service";
import { createChapterSchema, deleteChapterByIdSchema, getChaptersByCourseSchema, toggleChapterStatusSchema, updateChapterSchema } from "./chapters.model";

export const chaptersController = new Elysia({
    prefix: '/chapters'
})
.post('/', createChapter, createChapterSchema)
.put('/:chapterId', updateChapter, updateChapterSchema)
.get('/:courseId', getAllChaptersByCourseId, getChaptersByCourseSchema)
.patch('/:chapterId', toggelChapterStatusById, toggleChapterStatusSchema)
.delete('/:chapterId', deleteChapterById, deleteChapterByIdSchema)