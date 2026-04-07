import Elysia from "elysia";
import { uploadPdf, deleteMathpixPdf, downloadPdfTex, getUploadedPdfsByLesson, processBulkQuestions, bulkUploadLessonQuestions, bulkUploadExamQuestions, getUploadedPdfsByExam } from "./bulkupload.service";

export const bulkUploadController = new Elysia({
    prefix: '/bulk-upload',
    detail: {
        tags: ["Bulk Upload"],
    }
})
    .post("/upload", uploadPdf)
    // .post("/pdf-status/:pdf_id", getPdfStatus)
    // .get("/pdf-tex/:pdf_id", downloadPdfTex)
    .post("/process-bulk", processBulkQuestions)
    .delete("/delete-pdf/:pdf_id", deleteMathpixPdf)
    .get("/pdfs/lesson/:lessonId", getUploadedPdfsByLesson)
    .get("/pdfs/exam/:examId", getUploadedPdfsByExam)
    .post("/upload-lesson-questions", bulkUploadLessonQuestions)
    .post("/upload-exam-questions", bulkUploadExamQuestions)
