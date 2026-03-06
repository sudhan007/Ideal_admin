import Elysia from "elysia";
import { createTaskDto, GetSubmissionHistoryDto, GetSubmissionsDto, getTasksDto, ReviewTaskDto, SubmitTaskDto } from "./mytask.model";
import { createTask, GetSubmissionDetails, GetSubmissionHistory, GetSubmissions, getTasks, GetTimeline, ReviewTask, SubmitTasks, updateTask } from "./mytask.service";
import { adminAndStudent, adminOnly, studentOnly } from "@lib/utils/roles-guard";

export const taskController = new Elysia({
    prefix: '/task',
    detail: {
        tags: ["Tasks"],
    }
})


    .post("/", createTask, createTaskDto)
    .put("/:id", updateTask, createTaskDto)
    .get("/", getTasks, { ...getTasksDto, beforeHandle: adminAndStudent })
    .post("/submit", SubmitTasks, { ...SubmitTaskDto, beforeHandle: studentOnly })
    .post("/review", ReviewTask, { ...ReviewTaskDto, beforeHandle: adminOnly })
    .get("/submissions", GetSubmissions, { ...GetSubmissionsDto, beforeHandle: adminAndStudent })
    .get("/submissions/:id", GetSubmissionDetails, { beforeHandle: adminAndStudent })
    .get("/submission-history", GetSubmissionHistory, { ...GetSubmissionHistoryDto, beforeHandle: adminAndStudent })
    .get("/timeline/:submissionId", GetTimeline, {
        beforeHandle: adminAndStudent,
    });