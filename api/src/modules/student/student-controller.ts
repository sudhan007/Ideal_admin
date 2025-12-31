import Elysia from "elysia";
import { addEducationDetails, registerStudentDetails, updateStudentProfile } from "./student.service";
import { educationDetailsCreateSchema, studentDetailsCreateSchema, studentUpdateSchema } from "./student-model";
import { studentOnly } from "@lib/utils/roles-guard";

export const studentProfileController = new Elysia({
    prefix: '/student',
    detail: {
        tags: ["Student Registration"],
    }
})

    .post("/details", registerStudentDetails, { ...studentDetailsCreateSchema, beforeHandle: studentOnly })
    .post("/education-details", addEducationDetails, { ...educationDetailsCreateSchema, beforeHandle: studentOnly })
    .post("/update-details", updateStudentProfile, { ...studentUpdateSchema, beforeHandle: studentOnly })
