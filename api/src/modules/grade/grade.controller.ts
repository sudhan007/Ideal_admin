import { Elysia } from "elysia";
import { createGrade, deleteGradeById, getAllGrades, updateGrade } from "./grade.service";
import { getGradeDto, gradeCreateDto, GradeDeleteSchemaDto, gradeUpdateDto } from "./grade.model";
import { adminAndStudent, adminOnly } from "@lib/utils/roles-guard";

export const gradeController = new Elysia({
    prefix: '/grades',
    detail: {
        tags: ["Grade Of Education"]
    }
})
    .post('/', createGrade, { ...gradeCreateDto, beforeHandle: adminOnly })
    .put('/:gradeId', updateGrade, { ...gradeUpdateDto, beforeHandle: adminOnly })
    .get('/', getAllGrades, { ...getGradeDto, beforeHandle: adminAndStudent })
    .delete('/:gradeId', deleteGradeById, { ...GradeDeleteSchemaDto, beforeHandle: adminOnly })
