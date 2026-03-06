import Elysia from "elysia";
import { addEducationDetails, getAllStudents, deleteMyAccount, getEnrolledCourses, getStudentById, getStudentCourseDetailsByIds, getStudentProfile, getStudentSession, registerStudentDetails, updateStudentDetails, adminUpdateStudentDetails, toggeleStudentStatusById } from "./student.service";
import { educationDetailsCreateSchema, studentDetailsCreateSchema, studentUpdateSchema, studentSessionDto, getStudentsListDto, getStudentByIdDto, getEnrolledCoursesDto, getStudentProfileDto, adminstudentUpdateSchema, studentStatusToggleSchema } from "./student-model";
import { adminAndStudent, adminOnly, studentOnly } from "@lib/utils/roles-guard";

export const studentProfileController = new Elysia({
    prefix: '/student',
    detail: {
        tags: ["Student "],
    }
})

    .post("/details", registerStudentDetails, { ...studentDetailsCreateSchema, beforeHandle: studentOnly })
    .post("/education-details", addEducationDetails, { ...educationDetailsCreateSchema, beforeHandle: studentOnly })
    .put("/update-details", updateStudentDetails, { ...studentUpdateSchema, beforeHandle: studentOnly })
    .put("/admin-update-details", adminUpdateStudentDetails, { ...adminstudentUpdateSchema, beforeHandle: adminOnly })
    .get("/session", getStudentSession, { ...studentSessionDto, beforeHandle: studentOnly })
    .post("/delete-myaccount", deleteMyAccount)
    .get("/", getStudentSession, { ...studentSessionDto, beforeHandle: studentOnly })
    .get("/list", getAllStudents, { ...getStudentsListDto, beforeHandle: adminOnly })
    .get("/:studentId", getStudentById, { ...getStudentByIdDto, beforeHandle: adminAndStudent })
    .get("/enrolled-courses/:studentId", getEnrolledCourses, { ...getEnrolledCoursesDto, beforeHandle: adminAndStudent })
    .get("/profile", getStudentProfile, { ...getStudentProfileDto, beforeHandle: studentOnly })
    .get("/enrolled-course-details/:studentId/:courseId", getStudentCourseDetailsByIds, { beforeHandle: adminAndStudent })
    .patch('/toggle-status/:studentId', toggeleStudentStatusById, { ...studentStatusToggleSchema, beforeHandle: adminOnly })



