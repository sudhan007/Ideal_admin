import Elysia from "elysia";
import { addQuestionToExam, createExam, getAllQuestions, getExamQuizQuestions, getExams, getExamsByCourse, getQuestionById, GetSubmissions, submitExamQuizAnswers, updateExam, updateExamQuestion } from "./exam.service";
import { addQuestionToExamDto, createExamDto, examquestionUpdateDto, getAllQuizQuestionsDto, getExamDto, getExamQuizQuestionsDto, getQuestionsByIdDto, GetSubmissionsDto, submitExamQuizAnswersDto } from "./exam.model";
import { adminAndStudent } from "@lib/utils/roles-guard";

export const ExamController = new Elysia({
    prefix: '/exam',
    detail: {
        tags: ["Exams"],
    }
})
    .post("/", createExam, createExamDto)
    .put("/:id", updateExam, createExamDto)
    .get("/", getExams, { ...getExamDto, beforeHandle: adminAndStudent })
    .get("/dropdown", getExamsByCourse, { ...getExamDto, beforeHandle: adminAndStudent })
    .post("/add-question", addQuestionToExam, { ...addQuestionToExamDto, beforeHandle: adminAndStudent })
    .patch("/update-question/:questionId", updateExamQuestion, { ...examquestionUpdateDto, beforeHandle: adminAndStudent })
    .get("/questions", getExamQuizQuestions, { ...getExamQuizQuestionsDto, beforeHandle: adminAndStudent })
    .post("/submit-answers", submitExamQuizAnswers, { ...submitExamQuizAnswersDto, beforeHandle: adminAndStudent })
    .get("/question/:questionId", getQuestionById, getQuestionsByIdDto)
    .get("/all-questions", getAllQuestions, getAllQuizQuestionsDto)
    .get("/submissions", GetSubmissions, { ...GetSubmissionsDto, beforeHandle: adminAndStudent })

