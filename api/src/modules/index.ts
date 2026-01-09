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
