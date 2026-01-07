import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";

export const STUDENTS_COLLECTION = "students";


const educationDetailsSchema =
    t.Object({
        grade: t.Union([
            t.Literal("I"), t.Literal("II"), t.Literal("III"), t.Literal("IV"),
            t.Literal("V"), t.Literal("VI"), t.Literal("VII"), t.Literal("VIII"),
            t.Literal("IX"), t.Literal("X"), t.Literal("XI"), t.Literal("XII"),
        ]),
        nameOfTheBoard: t.Union([t.Literal("CBSE"), t.Literal("TN State Board")]),
        previousYearAnnualTotalMarks: t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" }),
        previousYearMathMarks: t.String({ pattern: "^[0-9]+(\\.[0-9]{1,2})?$" }),
        referedBy: t.Optional(t.String()),
    })


const studentDetailsCreateModel =
    t.Object({
        studentName: t.String(),
        dateOfBirth: t.String({ format: "date" }),
        gender: t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other")]),
        studentPhoneNumber: t.String({ pattern: "^[0-9]{10}$" }),
        parentPhoneNumber: t.String({ pattern: "^[0-9]{10}$" }),
        parentName: t.String(),
        address: t.String(),
        email: t.Optional(t.String({ format: "email" })),
        isActive: t.Boolean({ default: true }),
        studentProfile: t.File({ type: "image/*" }),
        ...baseFields.properties,
    })


const studentUpdateModel =
    t.Object({
        studentName: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String({ format: "date" })),
        gender: t.Optional(t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other")])),
        studentPhoneNumber: t.Optional(t.String({ pattern: "^[0-9]{10}$" })),
        parentPhoneNumber: t.Optional(t.String({ pattern: "^[0-9]{10}$" })),
        parentName: t.Optional(t.String()),
        address: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        registrationComplete: t.Optional(t.Boolean()),
        grade: t.Optional(t.Union([
            t.Literal("I"), t.Literal("II"), t.Literal("III"), t.Literal("IV"),
            t.Literal("V"), t.Literal("VI"), t.Literal("VII"), t.Literal("VIII"),
            t.Literal("IX"), t.Literal("X"), t.Literal("XI"), t.Literal("XII"),
        ])),
        nameOfTheBoard: t.Optional(t.Union([t.Literal("CBSE"), t.Literal("TN State Board")])),
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

export type StudentDetailsCreateInput = typeof studentDetailsCreateSchema.body.static;
export type EducationDetailsCreateInput = typeof educationDetailsCreateSchema.body.static;
export type StudentUpdateInput = typeof studentUpdateSchema.body.static;