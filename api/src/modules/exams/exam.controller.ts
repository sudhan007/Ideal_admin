import Elysia from "elysia";
import { addQuestionToExam, createExam, examDeleteQuestion, getAllQuestions, getExamQuizQuestions, getExams, getExamsByCourse, getQuestionById, GetSubmissions, studentExamReports, submitExamQuizAnswers, updateExam, updateExamQuestion } from "./exam.service";
import { addQuestionToExamDto, createExamDto, deleteExamQuestionDto, examquestionUpdateDto, getAllQuizQuestionsDto, getExamDto, getExamQuizQuestionsDto, getQuestionsByIdDto, GetSubmissionsDto, studentExamReportsDto, submitExamQuizAnswersDto } from "./exam.model";
import { adminAndStudent, studentOnly } from "@lib/utils/roles-guard";

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
    .get("/student-report", studentExamReports, { ...studentExamReportsDto, beforeHandle: studentOnly })
    .delete("/deletequestion", examDeleteQuestion, deleteExamQuestionDto)
