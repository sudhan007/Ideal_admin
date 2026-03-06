import { t } from "elysia";

const educationDetailsSchema =
    t.Object({
        grade: t.String({ default: "gradeId" }),
        nameOfTheBoard: t.String({ default: "boardId" }),
        previousYearAnnualTotalMarks: t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" }),
        previousYearMathMarks: t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" }),
        referedBy: t.Optional(t.String()),
    })


const studentDetailsCreateModel =
    t.Object({
        studentName: t.String(),
        dateOfBirth: t.String({ format: "date" }),
        gender: t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other")]),
        studentPhoneNumber: t.String(),
        parentPhoneNumber: t.String(),
        parentPhoneNumber2: t.Optional(t.String()),
        parentName: t.String(),
        address: t.String(),
        email: t.Optional(t.String({ format: "email" })),
        studentProfile: t.File({ type: "image/*" }),
    })


const studentUpdateModel =
    t.Object({
        studentName: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String({ format: "date" })),
        gender: t.Optional(t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other")])),
        studentPhoneNumber: t.Optional(t.String()),
        parentPhoneNumber: t.Optional(t.String()),
        parentPhoneNumber2: t.Optional(t.String()),
        parentName: t.Optional(t.String()),
        address: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        registrationComplete: t.Optional(t.Boolean()),
        grade: t.Optional(t.String(),),
        nameOfTheBoard: t.Optional(t.String()),
        previousYearAnnualTotalMarks: t.Optional(t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" })),
        previousYearMathMarks: t.Optional(t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" })),
        referedBy: t.Optional(t.Optional(t.String())),
        studentProfile: t.Optional(
            t.File({
                type: "image/*",
                description: "New profile image (optional)",
            })
        ),
    })

const adminstudentUpdateModel =
    t.Object({
        id: t.String(),
        studentName: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String({ format: "date" })),
        gender: t.Optional(t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other")])),
        studentPhoneNumber: t.Optional(t.String()),
        parentPhoneNumber: t.Optional(t.String()),
        parentPhoneNumber2: t.Optional(t.String()),
        parentName: t.Optional(t.String()),
        address: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        registrationComplete: t.Optional(t.Boolean()),
        grade: t.Optional(t.String(),),
        nameOfTheBoard: t.Optional(t.String()),
        previousYearAnnualTotalMarks: t.Optional(t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" })),
        previousYearMathMarks: t.Optional(t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" })),
        referedBy: t.Optional(t.Optional(t.String())),
        studentProfile: t.Optional(
            t.File({
                type: "image/*",
                description: "New profile image (optional)",
            })
        ),
    })

export const studentDetailsCreateSchema = {
    body: studentDetailsCreateModel,
    detail: {
        summary: "Step 1: Register Student Personal Details",
        description: "Upload profile image and personal info",
    },
    contentTypes: ["multipart/form-data"],
};

export const educationDetailsCreateSchema = {
    body: educationDetailsSchema,
    detail: {
        summary: "Step 2: Add Education Details",
        description: "Upload profile image and personal info",
    },
};

export const studentUpdateSchema = {
    body: studentUpdateModel,
    detail: {
        summary: "Update Student Profile",
        description: "Partially update student details. Can upload new profile image.",
    },
    contentTypes: ["multipart/form-data"],
};

export const adminstudentUpdateSchema = {
    body: adminstudentUpdateModel,
    detail: {
        summary: "Update Student Profile",
        description: "Partially update student details. Can upload new profile image.",
    },
    contentTypes: ["multipart/form-data"],
};


export const studentSessionDto = {
    detail: {
        summary: "Get Student Session",
        description: "Get student session details",
    }
}

export const getStudentsListDto = {
    query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        board: t.Optional(t.String()),
        grade: t.Optional(t.String()),
        gender: t.Optional(t.String()),
        search: t.Optional(t.String()),
        sortBy: t.Optional(t.Union([t.Literal("studentName"), t.Literal("createdAt")], { default: "createdAt" })),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")], { default: "asc" })),
    }),
    detail: {
        summary: "Get all Students",
        description: "Retrieve a list of all studnets",
    }
}

export const getStudentByIdDto = {
    params: t.Object({
        studentId: t.String(),
    }),
    detail: {
        summary: "Get Student by ID",
        description: "Retrieve full details of a student including populated fields (grade, board) and enrolled courses with their details.",
    },
};
export const getEnrolledCoursesDto = {
    params: t.Object({
        studentId: t.String(),
    }),
    detail: {
        summary: "Get enrolled Courses by student ID",
        description: "Get enrolled Courses by student ID",
    },
};
export const getStudentProfileDto = {
    detail: {
        summary: "Get Profile Details",
        description: "Get student profile details",
    },
};

export const studentStatusToggleSchema = {
    params: t.Object({
        studentId: t.String(),
    }),
    detail: {
        summary: "Toggle student active status",
        description: "Activate or deactivate a student by its ID",
    }
};

export type StudentDetailsCreateInput = typeof studentDetailsCreateSchema.body.static;
export type EducationDetailsCreateInput = typeof educationDetailsCreateSchema.body.static;
export type StudentUpdateInput = typeof studentUpdateSchema.body.static;
export type AdminStudentUpdateInput = typeof adminstudentUpdateSchema.body.static;
export type StudentSessionSchema = typeof studentSessionDto.detail
export type StudentListSchema = typeof getStudentsListDto.query.static
export type GetStudentByIdSchema = typeof getStudentByIdDto.params.static
export type getEnrolledCoursesSchema = typeof getEnrolledCoursesDto.params.static
export type getStudentProfileSchema = typeof getStudentProfileDto.detail
