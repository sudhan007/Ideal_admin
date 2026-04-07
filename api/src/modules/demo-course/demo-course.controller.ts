import { Elysia } from "elysia";
import { addQuestionToDemoCourse, createDemoCourse, demoDeleteQuestion, getAllQuestions, getCourseDemo, getQuestionById, getQuizQuestions, submitQuizAnswers, updateDemoCourse, updateExamQuestion } from "./demo-course.service";
import { addQuestionToDemoCourseDto, createDemoCourseDto, demoCourseGetQueryDto, demoDeleteQuestionDto, demoquestionUpdateDto, getDemoQuestionsByIdDto, getDemoQuizQuestionsDto, submitDemoQuizAnswersDto, updateDemoCourseDto } from "./demo-course.model";
import { adminAndStudent } from "@lib/utils/roles-guard";

export const DemoCourseController = new Elysia({
    prefix: '/course-demo',
    detail: {
        tags: ["Demo Course"]
    }
})
    .post('/', createDemoCourse, createDemoCourseDto)
    .put('/:id', updateDemoCourse, updateDemoCourseDto)
    .get('/', getCourseDemo, demoCourseGetQueryDto)
    .post("/add-question", addQuestionToDemoCourse, { ...addQuestionToDemoCourseDto, beforeHandle: adminAndStudent })
    .patch("/update-question/:questionId", updateExamQuestion, { ...demoquestionUpdateDto, beforeHandle: adminAndStudent })
    .get("/questions", getQuizQuestions, { ...getDemoQuizQuestionsDto, beforeHandle: adminAndStudent })
    .post("/submit-answers", submitQuizAnswers, { ...submitDemoQuizAnswersDto, beforeHandle: adminAndStudent })
    .get("/question/:questionId", getQuestionById, getDemoQuestionsByIdDto)
    .get("/all-questions", getAllQuestions, getDemoQuizQuestionsDto)
    .delete("/deletequestion", demoDeleteQuestion, demoDeleteQuestionDto)



