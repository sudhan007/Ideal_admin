import { Elysia } from "elysia";
import { courseController } from "./courses/course.controller";
import { staffsController } from "./staffs/staffs.controller";
import { chaptersController } from "./chapters/chapters.controller";
import { lessonsController } from "./lessons/lessons.controller";
import { studentAuthController } from "./authentication/student/student-auth.controller";
import { studentProfileController } from "./student/student-controller";
import { adminAuthController } from "./authentication/admin/admin-auth.controller";
import { boardController } from "./board/board.controller";
import { gradeController } from "./grade/grade.controller";
import { paymentController } from "./payment/payment.controller";
import { questionController } from "./questions/question.controller";
import { courseForeCastController } from "./course-forecasting/course-forecasting.controller";
import { courseTrackingController } from "./course-tracking/course-tracking.controller";
import { taskController } from "./mytask/mytask.controller";
import { batchController } from "./batches/batches.controller";
import { attendanceController } from "./attendance/attendance.controller";
import { courseEnrollmentController } from "./course-enrollment/course-enrollment.controller";
import { adminDashBoardController } from "./dashboard/dashbord.controller";
import { notificationController } from "./notification/notification.controller";
import { ExamController } from "./exams/exam.controller";
import { DemoCourseController } from "./demo-course/demo-course.controller";
import { QuestionBankController } from "./question-bank/questionbank.controller";
import { appVersionController } from "./appversion/appversion.controller";
import { bulkUploadController } from "./bulkupload/bulkupload.controller";

export const baseController = new Elysia({
    prefix: '/api',
})
    .use(adminAuthController)
    .use(paymentController)
    .use(gradeController)
    .use(studentAuthController)
    .use(boardController)
    .use(studentProfileController)
    .use(courseController)
    .use(staffsController)
    .use(chaptersController)
    .use(lessonsController)
    .use(questionController)
    .use(courseForeCastController)
    .use(courseTrackingController)
    .use(taskController)
    .use(batchController)
    .use(attendanceController)
    .use(courseEnrollmentController)
    .use(adminDashBoardController)
    .use(notificationController)
    .use(ExamController)
    .use(DemoCourseController)
    .use(QuestionBankController)
    .use(appVersionController)
    .use(bulkUploadController)