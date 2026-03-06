import { Elysia } from "elysia";
import { createChapter, deleteChapterById, getAllChaptersByCourseId, getAllChaptersDropDown, toggelChapterStatusById, updateChapter } from "./chapters.service";
import { createChapterSchema, deleteChapterByIdSchema, getChaptersByCourseSchema, toggleChapterStatusSchema, updateChapterSchema } from "./chapters.model";
import { adminAndStudent } from "@lib/utils/roles-guard";

export const chaptersController = new Elysia({
    prefix: '/chapters'
})
    .post('/', createChapter, createChapterSchema)
    .put('/:chapterId', updateChapter, updateChapterSchema)
    .get('/:courseId', getAllChaptersByCourseId, { ...getChaptersByCourseSchema, beforeHandle: adminAndStudent })
    .patch('/:chapterId', toggelChapterStatusById, toggleChapterStatusSchema)
    .delete('/:chapterId', deleteChapterById, deleteChapterByIdSchema)
    .get('/dropdown/:courseId', getAllChaptersDropDown, { ...getChaptersByCourseSchema, beforeHandle: adminAndStudent })
