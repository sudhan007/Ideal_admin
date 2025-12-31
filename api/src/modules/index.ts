import { Elysia } from "elysia";
import { courseController } from "./courses/course.controller";
import { staffsController } from "./staffs/staffs.controller";
import { chaptersController } from "./chapters/chapters.controller";
import { lessonsController } from "./lessons/lessons.controller";
import { studentAuthController } from "./authentication/student/student-auth.controller";
import { studentProfileController } from "./student/student-controller";

export const baseController = new Elysia({
    prefix: '/api'
})
    .use(studentAuthController)
    .use(studentProfileController)
    .use(courseController)
    .use(staffsController)
    .use(chaptersController)
    .use(lessonsController)
