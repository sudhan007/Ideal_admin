import { Elysia } from "elysia";
import { createGrade, getAllGrades, updateGrade } from "./grade.service";
import { getGradeDto, gradeCreateDto, gradeUpdateDto } from "./grade.model";

export const gradeController = new Elysia({
    prefix: '/grades',
    detail: {
        tags: ["Grade Of Education"]
    }
})
    .post('/', createGrade, gradeCreateDto)
    .put('/:gradeId', updateGrade, gradeUpdateDto)
    .get('/', getAllGrades, getGradeDto)