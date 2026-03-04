import { Elysia } from "elysia";
import { createBatch, getBatchById, getBatches, getBatchStudents, registerStudentToBatch, studentEnrolledBatches, updateBatch } from "./batches.service";
import { batchCreateDto, batchGetQueryDto, batchUpdateDto, getBatchByIdSchema, registerStudentToBatchDto } from "./batches.model";
import { adminAndStudent } from "@lib/utils/roles-guard";

export const batchController = new Elysia({
    prefix: '/batches',
    detail: {
        tags: ["Batches"]
    }
})
    .post('/', createBatch, batchCreateDto)
    .put('/:id', updateBatch, batchUpdateDto)
    .get('/', getBatches, batchGetQueryDto)
    .post("/enroll-student", registerStudentToBatch, registerStudentToBatchDto)
    .get('/students/:batchId', getBatchStudents)
    .get("/student/:studentId", studentEnrolledBatches)
    .get('/:batchId', getBatchById, { ...getBatchByIdSchema, beforeHandle: adminAndStudent })


